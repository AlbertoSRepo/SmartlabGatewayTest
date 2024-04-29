let allResults = [];
// Function to send the initial POST request
async function sendInitialPostRequest(apiKey, deviceId, url, specimenCode) {
  const headers = {
    'Content-Type': 'application/json'
  };
  const body = {
    jsonrpc: "2.0",
    method: "getListOfAllTests",
    id: "1",
    params: {
      api_key: apiKey,
      device_id: deviceId
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    //console.log('Initial response:', data);
    if (data.result && data.result.list_of_all_test_numbers) {
      await fetchTestDetails(apiKey, deviceId, data.result.list_of_all_test_numbers, url, specimenCode);
    }

    console.log('ALL RESULT :', allResults);
    
    //delete comment if you want to write the results to a file
  } catch (error) {
    console.error('There was an error!', error);
  }
}

// Function to request the details of each test and save the test numbers that correspond to the specimenCode
async function fetchTestDetails(apiKey, deviceId, testNumbers, url, specimenCode) {
  let matchingTestNumbers = [];

  for (const testNumber of testNumbers) {
    const headers = {
      'Content-Type': 'application/json'
    };
    const body = {
      jsonrpc: "2.0",
      method: "getTestInfoAndStatus",
      id: "1",
      params: {
        api_key: apiKey,
        device_id: deviceId,
        test_number: testNumber
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      //console.log(`Response for test number ${testNumber}:`, data);
      
      if (data.result && data.result.specimen_code === specimenCode) {
        matchingTestNumbers.push(testNumber);
        // Pass the response of this call to the next functions
        await fetchTestDetailsFromEndpoints(apiKey, deviceId, testNumber, url, data.result);
      }
    } catch (error) {
      console.error(`Error fetching details for test number ${testNumber}:`, error);
    }
  }

  console.log('Matching test numbers:', matchingTestNumbers);
}

// Function to make requests to the two endpoints and combine the results with the previous result
async function fetchTestDetailsFromEndpoints(apiKey, deviceId, testNumber, url, initialResult) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const body1 = {
    jsonrpc: "2.0",
    method: "getTestAcquisitionSettings",
    id: "1",
    params: {
      api_key: apiKey,
      device_id: deviceId,
      test_number: testNumber
    }
  };

  const body2 = {
    jsonrpc: "2.0",
    method: "getTestAcquiredDataAndResults",
    id: "1",
    params: {
      api_key: apiKey,
      device_id: deviceId,  // Assuming this is the same deviceId
      test_number: testNumber
    }
  };

  try {
    const response1 = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body1)
    });
    const data1 = await response1.json();

    const response2 = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body2)
    });
    const data2 = await response2.json();

    // Combine the results with the initial result from the specimen_code verification
    const combinedResults = {
      testNumber: testNumber,
      initialResult: initialResult,
      acquisitionSettings: data1.result,
      acquiredDataAndResults: data2.result
    };

    //console.log(`Combined results for test number ${testNumber}:`, combinedResults);
    allResults.push(combinedResults);

  } catch (error) {
    console.error(`Error fetching combined details for test number ${testNumber}:`, error);
  }
}
  
// Example of use
const apiKey = 'GatestWay2023!';
const deviceId = ' 259PGP-10-0036002C';
const specimenCode = 'S3-24001-TOW1';
const url = 'http://smartlab:8088/smartlabws/jsp/json.jsp';
sendInitialPostRequest(apiKey, deviceId, url, specimenCode);