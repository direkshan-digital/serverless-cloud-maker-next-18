// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/*
This file contains the main handler function that
can be deployed as a service for the backend of the
showcase demo.
 */


const StorageApi = require('@google-cloud/storage');
const storage = new StorageApi();

// imports all of the functions declared in the functions
// directory that can be called by the handler

const functions = require('./functions')

const validateData = (data) => {
/*
Confirms that the "data" parameter of a
request that specifies the input file
conains the required information. Should
be of the form
{
    gcsSourceUri,
    name,
    bucket
}

The source uri isn't actually used so I
should probably just get rid of it
 */
    if (data.constructor == Array) {
        throw 'Data should be a single object, not an array'
    }
    if (!data.gcsSourceUri) {
        throw 'No gcsSourceUri specified'
    }

    if (!data.bucket) {
        throw 'No bucket specified'
    }

    if (!data.name) {
        throw 'No name specified'
    }

    return true
}

/*
Conforms that the "parameters" passed to a function
as part of a given request are structured correctly and
valid according to the validation fucntion provided
 */

const validateParameters = (name, parameters={}) => {
    // grab the defaul values from the master dictionary
    const defaults = functions[name].parameters
    // generate the set of acceptable parameters
    const defaultKeys = Object.keys(defaults)
    // generate the set of keys specified by the user
    const inputKeys = Object.keys(parameters)

     // for each of the keys that were passed
    inputKeys.forEach(
        (key) => {
            if (defaultKeys.includes(key)) {
                // exract the specified value
                const value = parameters[key]
                // run the validator function to make sure
                // it's an acceptable value
                if (defaults[key].validate(value)) {
                    // set it in the result
                    return
                } else {
                    throw `Parameter ${key} with value ${value} was rejected by ${name}`
                }
            } else {
                throw `Parameter ${key} not expected for function ${name}. Expected one of ${defaultKeys}`
            }
        }
    )

    return true
}

 /*
Confirms that each entry of the "function" parameter of a request
specifies the name of a function that exists in this file
 */
const validateFunction = (func) => {
   
    if (!func.name) {
        throw 'No function name specified'
    }

    if (!functions[func.name]) {
        throw `No function exists with name ${func.name}`
    }

    validateParameters(func.name, func.parameters)

    return true
}

/*
Confirms that the request is correctly structured
 */
const validateRequest = (request) => {
    if (!request.body) {
        throw 'Invalid request: Missing body parameter.'
    }

    if (!request.body.data) {
        throw 'Invalid request: Missing input data.'
    }

    if (!request.body.functions) {
        throw 'Invalid request: Missing functions list.'
    }

    validateData(request.body.data)

    request.body.functions.map(validateFunction)

    return true
}


const assignParameters = (name, parameters = {}) => {
    // initialize an empty result dictionary
    const result = {}

    // grab the defaul values from the master dictionary
    const defaults = functions[name].parameters

    // generate the set of acceptable parameters
    const defaultKeys = Object.keys(defaults)

    // generate the set of keys specified by the user
    const inputKeys = Object.keys(parameters)

    // for each default key
    defaultKeys.forEach(
        (key) => {
            // set it as the default valud in the result dictionary
            result[key] = defaults[key].defaultValue
        }
    )

    // for each of the keys that were
    inputKeys.forEach(
        (key) => {
            // because we have already validated in a previous
            // step, we can assume that the input is correct
            result[key] = parameters[key]
        }
    )

    return result
}

const handler = (request, response) => {
    const outputBucketName = 'cloud-maker-outputs-final'

    // console.log('Starting handler')
    // first, make sure that
    // the request is valid
    try {
        // validate request data
        validateRequest(request)
    } catch (err) {
        // if the request is bad
        console.error(err)
        // send the error as the response
        response.send(err)
        // stop execution of the function
        return
    }

    // convert the json in the
    // request to the objects
    // produced by the client library
    // (so that subroutines can download it)
    const data = request.body.data
    const file = storage.bucket(data.bucket).file(data.name)


    // reduce the list of functions to a promise that
    // resolves when they have all been completed
    return request
        .body
        .functions
        .reduce(
            // at each step of the reduction
            (accPromise, nextFunction) =>
                // Each function needs the ability
                // to resolve asynchronously, so we
                // assume that result of the previous
                // call was a promise.
                accPromise
                    .then(
                        // the promise will resolve with the accumulator
                        (acc) =>
                            // assuming that the named function exists, extract it from the
                            // functions dictionary
                            // and call it on the accumulator with the passed parameters
                            functions[nextFunction.name](acc, assignParameters(nextFunction.name, nextFunction.parameters))
                    )
                    .catch(console.error)
            // to guarantee our assumption is correct,
            // conver the initial value to a promise resolution
            , Promise.resolve(file)
        )
        // then copy the final result to the output bucket
        .then(
            (resultFile) =>
                resultFile.copy(
                    // keep the name of the file
                    storage
                        // but move it to the final bucket
                        .bucket(outputBucketName)
                        .file(resultFile.name)
                )
        )
        // and then send the final file to terminate the function
        .then(([outputFile]) => response.send(outputFile))

        // catch any errors in this process
        .catch((err) => response.send(err))
}


module.exports = {
    // export the handler so that it
    // can be deployed to gcp
    handler,

    // exports the functions for testing
    functions,

    // export the validators for testing
    validateFunction,
    validateRequest,
    validateData,
    validateParameters,
    assignParameters,
}