import React, { useEffect, useRef,useState } from 'react'
import range from 'lodash/range'
import produce from 'immer'
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50]

export function convertTimestampToDate(timestamp) {
    return timestamp ? new Date(timestamp).toLocaleString('en-US', { timeZone: localStorage.timeZone }) : "-";
};

const getAccessorName = accessor => {
	if (['createdAt', 'updatedAt'].includes(accessor)) {
		accessor = accessor.replace('At', 'By')
	}
	return accessor
}

const isValidItem = (value, filterKeyword) => {
	let isValueUndefined = value == undefined
	let isValueArray = Array.isArray(value)
	if (isValueUndefined) {
		return false
	} else if (isValueArray) {
		return value.includes(filterKeyword)
	} else {
		return value
			.toString()
			.toLowerCase()
			.includes(filterKeyword.toLowerCase())
	}
}
export const getFilteredData = (columns, paginatedData) => {
	const filteredColumns = columns.filter(
		temp => temp.filterable && temp.value
	)
	if (filteredColumns.length)
		paginatedData = paginatedData.filter(temp => {
			return filteredColumns.every(col => {
				let filterValue = col.value
				let accessor = getAccessorName(col.accessor)
				let accessedValue = temp[accessor]
				let isValidDataItem
				if (col.customFilterFunction) {
					isValidDataItem = col.customFilterFunction(temp, col.value)
				} else {
					isValidDataItem = isValidItem(accessedValue, filterValue)
				}
				return isValidDataItem
			})
		})
	let sortCol = columns.find(temp => temp.sortValue)
	if (sortCol) {
		paginatedData.sort((a, b) => {
			let accessor = getAccessorName(sortCol.accessor)
			let value1 = a[accessor] && a[accessor].toLowerCase()
			let value2 = b[accessor] && b[accessor].toLowerCase()
			if (value1 < value2) return sortCol.sortValue === 'DESC' ? 1 : -1
			if (value1 > value2) return sortCol.sortValue === 'DESC' ? -1 : 1
			return 0
		})
	}
	return { paginatedData, paginatedDataItemsCount: paginatedData.length }
}

export const getHtmlForCell = (row, { accessor, width, className, bold }) => {
	let isCreatedOrUpadatedField = ['createdAt', 'updatedAt'].includes(accessor)
	if (isCreatedOrUpadatedField) {
		let creatorOrupdator =
			accessor === 'createdAt' ? row.createdBy : row.updatedBy
		return (
			<React.Fragment>
				<h6>{creatorOrupdator}</h6>
				<p>{convertTimestampToDate(row[accessor])}</p>
			</React.Fragment>
		)
	} else if (accessor === 'lastReportedAt') {
		return (
			<h6 className={className || ''}>
				{convertTimestampToDate(row[accessor])}
			</h6>
		)
	}
	if (bold) {
		return (
			<h6 className={className || ''}>
				<strong>{row[accessor] || '-'}</strong>
			</h6>
		)
	}
	return <h6 className={className || ''}>{typeof row[accessor] !==  undefined ?row[accessor] : '-'}</h6>
}

export const getBlankSkeletons = (pageSize, length) => {
	let element = document.getElementById('dataItemDiv')
	if (element) {
		let arrLength = pageSize - length
		let skeletons = Array(arrLength).fill('')
		return skeletons.map((skeleton, i) => (
			<div key={i} className="list-view-body">
				<div
					className="list-view-item"
					style={{ height: element.clientHeight }}
				/>
			</div>
		))
	}
}

export const geticon = (dataItem, icon) => {
	if (icon.isDynamic) {
		let key = icon.status.key
		let showActiveClass = icon.status.trueValue
			? dataItem[key] === icon.status.trueValue
			: Boolean(dataItem[key])
		let className = showActiveClass
			? icon.status.activeClass
			: icon.status.inActiveClass
		return (
			<div className={`list-git-icon ${className}`}>
				<i className={icon.iconName}></i>
			</div>
		)
	}
	return (
		<div className="list-git-icon text-light-gray">
			<i className={icon.iconName}></i>
		</div>
	)
}

export const getStatusBar = (statusBar, row, index) => {
	let { className, tooltipText } = statusBar(row)
	if (tooltipText) {
		return (
			<div
				className={`list-view-border list-view-border-${className}`}
				data-tooltip
				data-tooltip-text={tooltipText}
				data-tooltip-place="bottom"
			/>
		)
	} else {
		return (
			<div className={`list-view-border list-view-border-${className}`} />
		)
	}
}

export const getFlexClass = width => {
	let widthNumber = width.toString().split('.')
	return widthNumber[1]
		? `flex-${widthNumber[0]}_${widthNumber[1]}`
		: `flex-${widthNumber[0]}`
}

export const rowClickHandler = (dataItem, itemClickHandler) => event => {
	let tagName = event.target.parentElement.tagName
	itemClickHandler && tagName !== 'BUTTON' && itemClickHandler(dataItem)
}

export const getPageNumbers = (totalPages, activePageNumber) => {
	if (totalPages < 6) return range(1, totalPages + 1)
	else {
		let start = activePageNumber < 4 ? 1 : activePageNumber - 2
		let end =
			activePageNumber < 4
				? 6
				: activePageNumber + 3 > totalPages
				? totalPages + 1
				: activePageNumber + 3
		if (end - start < 5) start = end - 5
		let arr = range(start, end)
		if (start !== 1) arr = [1, '...', ...arr]
		return arr
	}
}

export const getLastPageNumber = (
	activePageNumber,
	pageSize,
	paginatedDataItemsCount
) => {
	if (activePageNumber * pageSize > paginatedDataItemsCount) {
		return paginatedDataItemsCount
	}
	return activePageNumber * pageSize
}

export const updateColumnsForDefaultFilter = (defaultFilterValues, columns) => {
	let columnindexes = {}
	columns.map((col, index) => (columnindexes[col.accessor] = index))
	let updatedColumns = produce(columns, draftColumns => {
		defaultFilterValues.map(filter => {
			let { filterValue, accessor } = filter
			if (filterValue) {
				let requiredColumn = draftColumns[columnindexes[accessor]]
				requiredColumn.value = filterValue
			}
		})
	})
	return updatedColumns
}

export const useCustomEffect = (callBack, dependencies) => {
	let isInitialMount = useRef(true)
	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false
			return
		}

		return callBack()
	}, dependencies)
}

export const useDebounce = (value, delay, propColumnsChangedRef) => {
	const [debouncedValue, setDebouncedValue] = useState(value)
	let isDebouncingRequired = !propColumnsChangedRef.current
	if (propColumnsChangedRef.current) {
		propColumnsChangedRef.current = false
	}
	useCustomEffect(() => {
		let handler
		if (isDebouncingRequired) {
			handler = setTimeout(() => {
				setDebouncedValue(value)
			}, delay)
		} else {
			setDebouncedValue(value)
		}

		return () => {
			handler && clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}
