import logo from './logo.svg';
import './App.css';
import React from 'react'
import ListingTable from './components/ListingTable/index'
import './scss/main.scss';
import { useEffect } from 'react';
import axios from 'axios';
import { useState } from 'react';
import { useCallback } from 'react';

function App() {
  const [covidData,setCovidData] = useState(null)

  const onRefreshHandler  = useCallback(()=>{
    axios.get("https://api.covid19api.com/summary").then((reponse)=>{
      setCovidData(reponse.data)
  }).catch((error)=>{

  })
},[])
  useEffect(()=>{
    onRefreshHandler()
  },[onRefreshHandler])
  const columns = [
    {
      Header: "Country", width: 20,
      cell: (row) => (
        <h6 >{row.Country}</h6>
      )
    },
    // {
    //   Header: "Connection State", width: 15,
    //   cell: (row) => (
    //     <h6 className={row.connectionState ? "text-green" : "text-red"}>{row.connectionState ? "Connected" : "Not-Connected"}</h6>
    //   )
    // },
    { Header: "New Confirmed", width: 10, accessor: "NewConfirmed", sortable: true },
    { Header: "Total Confirmed", width: 10, accessor: "TotalConfirmed", sortable: true },
    { Header: "New Deaths", width: 10, accessor: "NewDeaths", sortable: true },
    { Header: "Total Deaths", width: 10, accessor: "TotalDeaths", sortable: true },
    { Header: "New Recovered", width: 10, accessor: "NewRecovered", sortable: true },
    { Header: "Total Recovered", width: 10, accessor: "TotalRecovered", sortable: true },
  ]

  return (
    <div>
            <div id="counter">
              <div className="item">
                <h6 className="count" data-number="50" ></h6>
                <h6 className="text">New Confirmed : {covidData ? covidData.Global.NewConfirmed : '-'}</h6>
              </div>
              <div className="item">
                <h6 className="count" data-number="50" ></h6>
                <h6 className="text">Total Confirmed : {covidData ? covidData.Global.TotalConfirmed : '-'}</h6>
              </div>
              <div className="item">
                <h6 className="count" data-number="50" ></h6>
                <h6 className="text">New Deaths : {covidData ? covidData.Global.NewDeaths : '-'}</h6>
              </div>
              <div className="item">
                <h6 className="count" data-number="50" ></h6>
                <h6 className="text">Total Deaths : {covidData ? covidData.Global.TotalDeaths : '-'}</h6>
              </div>
              <div className="item">
                <h6 className="count" data-number="50" />
                <h6 className="text">New Recovered : {covidData ? covidData.Global.NewRecovered : '-'}</h6>
              </div>
              <div className="item">
                <h6 className="count" data-number="50" ></h6>
                <h6 className="text">Total Recovered : {covidData ? covidData.Global.TotalRecovered : '-'}</h6>
              </div>
              <div className="item">
                <h6 className="count" data-number="50" ></h6>
                <h6 className="text">Total Recovered : {covidData ? covidData.Global.TotalRecovered : '-'}</h6>
              </div>
              <div className="item">
                <h6 className="count" data-number="50" ></h6>
                <a onClick={onRefreshHandler} className="text">Refresh </a>
              </div>
      </div>
      <div>
      <ListingTable
        columns={columns}
        data={covidData ? covidData.Countries:[]}
        isLoading={!covidData}
        defaultFilterValues={[{
          accessor: "type",
        }]}
      />
      </div>
    </div>
    
  )
}

export default App;
