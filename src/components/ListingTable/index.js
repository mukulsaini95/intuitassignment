import React, { useState, useEffect, useRef, useMemo, useReducer } from "react";
import cx from 'classnames';
import {
    getFilteredData, getHtmlForCell, getBlankSkeletons,
    geticon, getStatusBar, getFlexClass, PAGE_SIZE_OPTIONS,
    rowClickHandler, getPageNumbers, getLastPageNumber,
    updateColumnsForDefaultFilter,
    useDebounce, useCustomEffect
} from "./tableFunctionsRequired";
import _ from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import Skeleton from 'react-loading-skeleton'

const stateReducer = (state, action) => ({  
    ...state,
    ...(typeof (action) == "function" ? action(state) : action)
});

function ListingTable(props) {
    var { columns, data, pageChangeHandler, pagination, statusBar, icon, pageSize, activePageNumber, isLoading, totalItemsCount, itemClickHandler, id, className, defaultFilterValues, calledForActions } = props
    data = data || []
    pagination = typeof (pagination) == "boolean" ? pagination : true;

    let [state, setState] = useReducer(stateReducer, "", () => ({
        pageSize: pageSize && pageChangeHandler ? pageSize : 10,
        activePageNumber: activePageNumber && pageChangeHandler ? activePageNumber : 1,
        totalItemsCount: totalItemsCount || data.length,
        completeData: data,
        id,
        columns: defaultFilterValues && defaultFilterValues.some(filter => filter.filterValue) ? updateColumnsForDefaultFilter(defaultFilterValues, columns) : columns,
        filtersAndSort: {
            sort: null,
            filters: []
        }
    }));
    let propColumnsChangedRef = useRef(false);
    let debouncedColumns = useDebounce(state.columns, 300, propColumnsChangedRef);
    let { paginatedData, paginatedDataItemsCount } = pageChangeHandler ? { paginatedData: state.completeData, paginatedDataItemsCount: state.completeData.length } : getFilteredData(debouncedColumns, state.completeData);
    paginatedDataItemsCount = totalItemsCount || paginatedDataItemsCount
    let totalPages = Math.ceil(paginatedDataItemsCount / state.pageSize)
    let endIndex = (state.pageSize * state.activePageNumber);
    let startIndex = endIndex - state.pageSize;

    const inBuiltPageChangeHandler = (pageSize, activePageNumber) => {
        let pageSizeChanged = pageSize !== state.pageSize;
        if (pageSizeChanged) {
            let totalPages = Math.ceil(paginatedDataItemsCount / pageSize)
            if (totalPages < activePageNumber) {
                activePageNumber = totalPages
            }
        } else if (activePageNumber === "...") {
            activePageNumber = Math.ceil((getPageNumbers(totalPages, state.activePageNumber)[3] - 1) / 2)
        }
        setState({
            pageSize,
            activePageNumber
        })
    }

    pageChangeHandler = pageChangeHandler || inBuiltPageChangeHandler;
    if (!props.pageChangeHandler) {
        paginatedData = paginatedData.slice(startIndex, endIndex)
    }

    useEffect(() => {
        let activePageNumber = state.activePageNumber;
        if (pagination && !props.pageChangeHandler) {
            if (data.length !== state.completeData.length) {
                activePageNumber = 1
            }
        }
        setState({ totalItemsCount, completeData: data, activePageNumber })
    }, [data, pagination, props.pageChangeHandler, state.activePageNumber, state.completeData.length, totalItemsCount]);

    useEffect(() => {
        if (props.pageChangeHandler) {
            if (pageSize && pageSize !== state.pageSize)
                setState({ pageSize })
            if (activePageNumber && activePageNumber !== state.activePageNumber) {
                setState({ activePageNumber })
            }
        }
        if (id && id !== state.id) {
            setState({
                pageSize: pageSize && pageChangeHandler ? pageSize : 10,
                activePageNumber: activePageNumber && pageChangeHandler ? activePageNumber : 1,
                totalItemsCount: totalItemsCount || data.length,
                completeData: data,
                id,
                filtersAndSort: {
                    sort: null,
                    filters: []
                },
                columns
            })
        }
    }, [pageSize, activePageNumber, id, props.pageChangeHandler, state.id, state.pageSize, state.activePageNumber, pageChangeHandler, totalItemsCount, data, columns]);

    const onChangeHandler = (value, accessor) => {
        let columns = cloneDeep(state.columns)
        columns.find(temp => temp.accessor == accessor).value = value;
        setState({
            activePageNumber: 1,
            columns,
        })
    }

    const sortList = (operation, accessor) => {
        let columns = cloneDeep(state.columns)
        columns.map(temp => {
            temp.sortValue = ""
            if (temp.accessor == accessor) {
                temp.sortValue = operation
            }
        })
        setState({
            activePageNumber: 1,
            columns
        })
    }

    let initialRender = useRef(true);
    let columnsRef = useRef(null)
    useEffect(() => {
        if (initialRender.current) {
            columnsRef.current = JSON.stringify(columns);
            initialRender.current = false;
        } else {
            let newColumns = JSON.stringify(columns);
            if (columnsRef.current !== newColumns) {
                propColumnsChangedRef.current = true;
                columnsRef.current = newColumns;
                setState({
                    columns,
                });
            }
        }
    }, [columns])

    useCustomEffect(() => {
        if (props.pageChangeHandler) {
            const filters = state.columns.filter(temp => temp.filterable && temp.value).map(temp => ({ accessor: temp.accessor, value: temp.value }));
            const findSortColumn = state.columns.find(temp => temp.sortValue)
            const filtersAndSort = {
                sort: findSortColumn ? { accessor: findSortColumn.accessor, value: findSortColumn.sortValue } : null,
                filters
            }
            props.pageChangeHandler(state.pageSize, state.activePageNumber, filtersAndSort)
            setState({
                filtersAndSort
            })
        }
    }, [debouncedColumns])

    
    return (
        <React.Fragment>
            <div className="list-view">
                <div className="list-view-header d-flex">
                    {state.columns.map(({ Header, width, sortable }, index) => (
                        <p key={index} className={getFlexClass(width)} >{Header}</p>
                    ))}
                </div>
                {state.columns.some(temp => (temp.filterable || temp.sortable)) && 
                <div className="list-view-filter d-flex">
                    {state.columns.map(({ Header, width, sortable, filterable, filter, value, accessor, sortValue }, index) => {
                        if (filterable || sortable)
                            return <div className={`form-group ${!sortable ? "form-group-sort" : ""} ${getFlexClass(width)}`} key={index}>
                                {filterable && (filter ? filter({ value, onChangeHandler: (event, accessor) => onChangeHandler(event.target.value, accessor), accessor }) :
                                    <input type={Header === "Mobile Number" && calledForActions ? "number" : "text"} className="form-control" placeholder="Search.." value={value} onChange={(event) => onChangeHandler(event.target.value, accessor)} />)
                                }
                                {sortable &&
                                    <div className="dropdown">
                                        <button className="btn btn-light"><i className="fas fa-sort"></i></button>
                                        <div className="dropdown-menu">
                                            <p>Sort by</p>
                                            <ul className="list-style-none">
                                                <li className={cx("", { 'active': sortValue === "ASC" })} onClick={() => sortList("ASC", accessor)}><i className="far fa-sort-amount-down-alt"></i>A - Z</li>
                                                <li className={cx("", { 'active': sortValue === "DESC" })} onClick={() => sortList("DESC", accessor)}><i className="far fa-sort-amount-up-alt"></i>Z - A</li>
                                            </ul>
                                        </div>
                                    </div>
                                }
                            </div>
                        else
                            return <div className={`form-group ${getFlexClass(width)}`} key={index} />
                    })}
                </div>
                }
                {props.isLoading ?
                    <Skeleton count={6} /> :
                    <div className="list-view-body">
                        {paginatedData.length ?
                            paginatedData.map((dataItem, dataItemIndex) => (
                                <div className={"list-view-item " + className} key={dataItemIndex} id="dataItemDiv">
                                    {Boolean(statusBar) && getStatusBar(statusBar, dataItem, dataItemIndex)}
                                    <ul className="list-style-none d-flex" id="rowContainer" onClick={rowClickHandler(dataItem, itemClickHandler)}>
                                        {Boolean(icon) && geticon(dataItem, icon)}
                                        {columns.map((col, index) => (
                                            <li key={index} className={getFlexClass(col.width)}>
                                                {col.cell ? col.cell({ ...dataItem, index: dataItemIndex }) :
                                                    getHtmlForCell(dataItem, col)
                                                }
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )) :
                            <div className="list-view-empty"><h6>There is no data to display.</h6></div>
                        }
                        {/* {Boolean(paginatedData.length > 0 && paginatedData.length < state.pageSize) && getBlankSkeletons(state.pageSize, paginatedData.length)} */}
                    </div>
                }
            </div>

            {(pagination && paginatedData.length > 0) &&
                <div className="d-flex align-items-center pagination-box">
                    <div className="flex-50">
                        <h6>Showing {(((state.activePageNumber * state.pageSize) - state.pageSize) + 1)} to {getLastPageNumber(state.activePageNumber, state.pageSize, paginatedDataItemsCount)} of
                            <strong className="text-theme"> {paginatedDataItemsCount} rows</strong>
                            <span className="mr-l-10 mr-r-10">|</span>
                            Records Per Page:
                            <button className="btn btn-light dropdown-toggle" type="button" data-toggle="dropdown">{state.pageSize} </button>
                            <ul className="dropdown-menu">
                                {PAGE_SIZE_OPTIONS.map((size, index) => (
                                    <li key={index} onClick={() => size !== state.pageSize && pageChangeHandler(size, state.activePageNumber, state.filtersAndSort)}>{size}</li>
                                ))}
                            </ul>
                        </h6>
                    </div>
                    <div className="flex-50">
                        <ul className="list-style-none d-flex justify-content-end">
                            <li className="page-item" onClick={() => state.activePageNumber > 1 && pageChangeHandler(state.pageSize, state.activePageNumber - 1, state.filtersAndSort)}>
                                <a className={`page-link ${state.activePageNumber > 1 ? "bg-theme text-white" : "text-light-gray"}`}>
                                    <i className="far fa-angle-double-left mr-r-5"></i>Previous
                            </a>
                            </li>
                            {getPageNumbers(totalPages, state.activePageNumber).map((pageNumber, index) => (
                                <li key={index} className="page-item" onClick={() => pageNumber !== state.activePageNumber && pageChangeHandler(state.pageSize, pageNumber, state.filtersAndSort)}>
                                    <a className={`page-link ${state.activePageNumber === pageNumber ? "bg-theme text-white" : "text-gray"}`}>{pageNumber}</a>
                                </li>
                            ))}
                            <li className="page-item"
                                onClick={() => state.activePageNumber < totalPages && pageChangeHandler(state.pageSize, state.activePageNumber + 1, state.filtersAndSort)}>
                                <a className={`page-link ${state.activePageNumber < totalPages ? "bg-theme text-white" : "text-light-gray"}`}>
                                    Next<i className="far fa-angle-double-right mr-l-5"></i>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            }
        </React.Fragment>
    );
}

ListingTable.propTypes = {};

export default ListingTable;