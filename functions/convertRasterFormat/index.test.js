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

const convertRasterFormat = require('./index.js');
jest.mock('../helpers');
const helpers = require('../helpers');

const inFile = 'inFile.jpg';
const outFile = 'outFile.png';

describe('when convertRasterFormat is called', () => {
    it('should only accept .gif, .png, .jpg', () => {
        expect(convertRasterFormat.parameters).not.toBeUndefined();
        ['.gif', '.PNG', '.jpg'].map((extension) => {
            expect(
                convertRasterFormat
                    .parameters
                    .extension
                    .validate(extension)
            )
                .toBe(true);
        });

        ['.asdf', 'false', '.jpeg'].map((extension) =>
            expect(
                convertRasterFormat
                    .parameters
                    .extension
                    .validate(extension)
            )
                .not
                .toBe(true)
        );
    });

    it('should call resolveImageMagickConvert', () => {
        // set this mocked function to return
        // infile so that it is not undefined when
        // we run the test.
        helpers.createTempFileName.mockReturnValue(inFile);
        convertRasterFormat.applyChangeFormat(inFile, outFile);
        // we mocked the return value to just be inFile permanently,
        // // so just use inFile
        expect(helpers.resolveImageMagickConvert)
            .toHaveBeenCalledWith([inFile, inFile]);
    });
});

