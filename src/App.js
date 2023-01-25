import './App.css';
import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState([]);
  const [file, setFile] = useState();
  const [result, setResult] = useState([]);
  const [dataError, setDataError] = useState("");
  const [info, setInfo] = useState();

  const fileUpload = (e) => {
    //Clear all state variable and create an FileReader instance
    setDataError("");
    setInfo();
    setData([]);
    setFile();
    setResult([]);
    const fr = new FileReader();

    //Check if the file exists and if the extension is .csv. Set the error if
    //the file is not of type .csv.
    if(e.target.files.length > 0) {
        const input = e.target.files[0];
        if(input.type.split("/")[1] !== "csv") {
            setDataError("Only CSV files are supported! Please try again.");
            return;
        }
        setFile(e.target.files[0]);
    } else return;

    //Process the provided file
    fr.onload = async ({ target }) => {
      //Split the csv file by newline characters and create a holder variable
      //for the final data result. For memory saving sake we are going to
      //store the data in an array instead of an object
      const csv = target.result.split(/\r?\n/);
      let csvData = [];

      //Go trough each of the lines from the csv file and process individually
      for(let line of csv) {
        let fields = line.split(/\s/g)

        //Go trough each field of each line and process the data correctly
        for(let i = 0; i < fields.length; i++) {
          //If the field is supposed to be a number we parse it to int
          //otherwise we process it as data
          if(i < 2) fields[i] = parseInt(fields[i])
          else {
            //We use Date.parse to turn strings into unix time ints for
            //easier processing later. Data.parse handles most cases
            //of data formats We also replace NULL with timestamp of
            //the current time
            fields[i] = fields[i].replace(/\s/g, "");
            if(fields[i] !== "NULL") fields[i] = Date.parse(fields[i])
            else fields[i] = Date.now();
          }
        }

        //Add the line data to the final result
        csvData.push(fields);
      }

      //We set the data to a state variable so we can process it in another
      //function or listener
      setData(csvData);
    };
    fr.readAsText(e.target.files[0]);
  };
 
  //useEffect hook to listen when data is changed
  useEffect(() => {
    //Four variables which are the following:
    //hashMap - a hash table key-value pairs where key is the pair of employees
    //pairs - an array of all projects worked on by any pair of employees
    //maxTime - the biggest ammount of time worked on by any two employees
    //indexPair - the pair of employees corresponding to maxTime
    let hashMap = {};
    let pairs = [];
    let maxTime = 0;
    let indexPair;

    //Goes through all possible pairs of employees of the provided data
    //sheet and finds where they have worked together
    for(let i = 0; i < data.length - 1; i++) {
      for(let j = i + 1; j < data.length; j++) {
        //A and B are the employees indexes
        const A = data[i][0];
        const B = data[j][0];
        //Checks if the Project ID is identical as well as if the employee
        //IDs are different
        if(data[i][1] === data[j][1] && A !== B) {
          //Creates a hash index in the form of "A-B" where
          //A is always less than B to avoid collisions and
          //repetitions. Finds the latest start date and the
          //earliest end date to find total time worked together
          //and if the employees have worked together at all
          const hash = B > A ? A + "-" + B : B + "-" + A
          const start = Math.max(data[i][2], data[j][2])
          const end = Math.min(data[i][3], data[j][3])
          if(start > end) return;

          //Unix time converted to days and added to the array
          //of all possible pairs
          const total = Math.round((end - start)/1000/60/60/24);
          pairs.push([hash, data[i][1], total]);

          //Checks if this is the first occurence of the employee
          //pair and adds the time worked together to the total
          //regardless
          if(hash in hashMap) hashMap[hash] += total;
          else hashMap[hash] = total;

          //Checks if this is the largest ammount of time worked
          //together so far
          if(hashMap[hash] > maxTime) {
            maxTime = hashMap[hash];
            indexPair = hash;
          }
        }
      }
    }

    //Goes through all possible pairs and removes the ones that
    //dont correspond to the largerst pair as well as
    //converting the hash back to integers
    for(let i = 0; i < pairs.length; i++) {
      if(pairs[i][0] === indexPair) {
        const hash = pairs[i].shift().split("-");
        pairs[i].unshift(hash[0])
        pairs[i].unshift(hash[1])
      } else {
        pairs.splice(i, 1);
        i--;
      }
    }

    //Sets some information for later display
    if(indexPair) {
      setInfo({
        "firstEmployee":indexPair.split("-")[0],
        "secondEmployee":indexPair.split("-")[1],
        "total":maxTime,
        "projects":pairs.length
      })
    }

    //Final state variable with the data
    setResult(pairs)
  }, [data])

  return (
    <main className="max-w-prose w-4/5 mx-auto">
      <section className="my-20">
        <h1 className="text-3xl font-bold text-center text-gray-900">Pair of employees who have worked together the most</h1>
        <p className="text-center">by Martin Popov</p>
      </section>

      <p className="h-8 text-red-600 flex items-center gap-2 mb-2">{dataError && <><svg className="w-5 fill-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32z"/></svg>{dataError}</>}</p>
    
      <button className={`w-full h-12 border-2 ${dataError ? "border-red-600" : "border-cyan-800"} hover:bg-cyan-800 transition-colors group rounded-xl`}>
          <label htmlFor="csv" className="flex items-center h-full px-4 gap-4 cursor-pointer group-hover:text-white transition-colors">
            <svg className="w-4 group-hover:fill-white transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M175 223l-80 80c-9.375 9.375-9.375 24.56 0 33.94s24.56 9.375 33.94 0L168 297.9V400c0 13.25 10.75 24 24 24s24-10.75 24-24V297.9l39.03 39.03C259.7 341.7 265.8 344 272 344s12.28-2.344 16.97-7.031c9.375-9.375 9.375-24.56 0-33.94l-80-80C199.6 213.7 184.4 213.7 175 223zM365.3 93.38l-74.63-74.64C278.6 6.742 262.3 0 245.4 0H64C28.65 0 0 28.65 0 64l.0065 384c0 35.34 28.65 64 64 64H320c35.2 0 64-28.8 64-64V138.6C384 121.7 377.3 105.4 365.3 93.38zM336 448c0 8.836-7.164 16-16 16H64.02c-8.838 0-16-7.164-16-16L48 64.13c0-8.836 7.164-16 16-16h160L224 128c0 17.67 14.33 32 32 32h79.1V448z"/></svg>
            <p>Upload your CSV file here</p>
          </label>
          <input onChange={fileUpload} id="csv" name="csv" type="File"/>
      </button>

      {file && <p className="mt-2">Selected file: <strong>{file.name}</strong></p>}

      {file && result.length === 0 && <p>No pairs of employees found in the provided file!</p>}

      {info && <table className="text-left w-full mt-2">
        <tbody>
          <tr className="border-b border-cyan-800">
            <th className="py-1">Employee pair</th>
            <td>{info.firstEmployee} & {info.secondEmployee}</td>
          </tr>
          <tr className="border-b border-cyan-800">
            <th className="py-1">Total days worked together</th>
            <td>{info.total}</td>
          </tr>
          <tr>
            <th className="py-1">Total projects worked together</th>
            <td>{info.projects}</td>
          </tr>
        </tbody>
      </table>}
      
      {result.length > 0 && <h2 className="mt-8 font-bold text-xl">All projects worked on together</h2>}
      {result.length > 0 && <table className="text-left w-full">
        <thead>
          <tr className="border-b border-cyan-800">
            <th>Employee ID #1</th>
            <th>Employee ID #2</th>
            <th>Project ID</th>
            <th>Days worked</th>
          </tr>
        </thead>
        <tbody>
        {result.map((col, i) => (
          <tr className="border-b border-cyan-800 last:border-0" key={i}>
            <td>{col[0]}</td>
            <td>{col[1]}</td>
            <td>{col[2]}</td>
            <td>{col[3]}</td>
          </tr>
        ))}
        </tbody>

      </table>}
    </main>
  );
}

export default App;
