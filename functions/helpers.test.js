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
const helpers = require('./helpers');


describe('when createOutputFileName is called', () => {
    const filename = 'filename.png';
    const filenamedotout = filename + '.out';
    const outputPrefix = 'prefix';
    const prefixfilename = outputPrefix + '-' + filename;

    it('should append .out if the prefix coerces to false', () => {
        expect(helpers.createOutputFileName(filename))
            .toBe(filenamedotout);
        expect(helpers.createOutputFileName(filename, {}))
            .toBe(filenamedotout);
        expect(helpers.createOutputFileName(filename, {outputPrefix: false}))
            .toBe(filenamedotout);
        expect(helpers.createOutputFileName('bar.png', {outputPrefix: ''}))
            .toBe('bar.png.out');
    });

    it('should add the passed prefix', () => {
        expect(helpers.createOutputFileName(filename, {outputPrefix}))
            .toBe(prefixfilename);
        expect(helpers.createOutputFileName('bar.png', {outputPrefix: 'foo'}))
            .toBe('foo-bar.png');
    });
});

describe(' when annotationToShape is called', () => {
    const testResponseFactory = (vertices) => ({
        boundingPoly: {
            vertices,
        },
    });

    it('should work', () => {
        const testResponse = testResponseFactory([
            {x: 0, y: 0},
            {x: 100, y: 0},
            {x: 0, y: 100},
            {x: 100, y: 100},
        ]);
        expect(helpers.annotationToShape(testResponse))
            .toEqual(`100x100+0+0`);
    });

    it('should set offsets correctly', () => {
        const testResponse = testResponseFactory([
            {x: 10, y: 15},
            {x: 100, y: 100},
            {x: 100, y: 15},
            {x: 10, y: 100},
        ]);
        expect(helpers.annotationToShape(testResponse))
            .toEqual(`90x85+10+15`);
    });


    it('should create a square', () => {
        const testResponse = testResponseFactory([
            {x: 10, y: 15},
            {x: 100, y: 100},
            {x: 100, y: 15},
            {x: 10, y: 100},
        ]);
        expect(helpers.annotationToShape(testResponse, 'square'))
            .toEqual(`85x85+13+15`);
    });
    it('should create a circle', () => {
        const testResponse = testResponseFactory([
            {x: 10, y: 15},
            {x: 100, y: 100},
            {x: 100, y: 15},
            {x: 10, y: 100},
        ]);
        expect(helpers.annotationToShape(testResponse, 'circle'))
            .toEqual(`circle 56,58 13,58`);
    });
});


describe('when annotationsToPolygons is called', () => {
    const testAnnotationsFactory = (vertices) => ([{
        boundingPoly: {
            vertices,
        },
    }]);
    it('should reduce the list of vertices to a string of tubles', () => {
        const testAnnotation = testAnnotationsFactory([
            {x: 1, y: 2},
            {x: 3, y: 4},
            {x: 5, y: 6},
            {x: 7, y: 8},
        ]);
        expect(helpers.annotationsToPolygons(testAnnotation))
            .toEqual('polygon 1,2 3,4 5,6 7,8');
    });
});

describe('when createOutputFileName is called', () => {
    it('should add the prefix', () => {
        expect(
            helpers
                .createOutputFileName('foo.js', {outputPrefix: 'blurred'})
        )
        .toBe('blurred-foo.js');
    });
});

describe('when createTempFileName is called', () => {
    it('should just prepend /tmp/', () => {
        expect(helpers.createTempFileName('test2.js')).toBe('/tmp/test2.js');
    });
});

describe('createTempFileName + createOutputFileName', () => {
    it('should create a file in /tmp', () => {
        const outputFileName = helpers
            .createOutputFileName('img1.js', {outputPrefix: 'cropped'});
        expect(
            helpers.createTempFileName(outputFileName)
        ).toBe('/tmp/cropped-img1.js');
    });
});

describe('when resolveImageMagickCommand is used', () => {
    it('should call the passed function on the inputs', () => {
        const cmd = jest.fn();
        const args = [];
        helpers.resolveImageMagickCommand(cmd, args);
        expect(cmd).toHaveBeenCalled();
    });

    it('should reject if the command throws', () => {
        const result = 'result';
        const goodCmd = jest.fn((a, cb) => cb(false, result));
        const args = [];
        helpers
            .resolveImageMagickCommand(goodCmd, args)
            .then((r) => expect(r).toBe(result));
    });

    it('should resolve if the command succeeds', () => {
        const err = 'err';
        const badCmd = jest.fn((a, cb) => cb(err, false));
        const args = [];
        helpers
            .resolveImageMagickCommand(badCmd, args)
            .catch((e) => expect(e).toBe(err));
    });
});

describe('when changeExtension is called', () => {
    it('should change extensions as expected', () => {
        expect(helpers.changeExtension('test.png', '.jpg')).toBe('test.jpg');
        expect(helpers.changeExtension('test.jpg', '.png')).toBe('test.png');
        expect(helpers.changeExtension('test.png', '.gif')).toBe('test.gif');
        expect(helpers.changeExtension('test.png', '')).toBe('test.png');
        expect(helpers.changeExtension('test.png')).toBe('test.png');
    });
});

describe('when annotationToDimensions is called', () => {
    const testAnnotationFactory = (vertices) => ({
        boundingPoly: {
            vertices,
        },
    });
    it('should reduce the list of vertices to a string of tubles', () => {
        const testAnnotation = testAnnotationFactory([
            {x: 1, y: 2},
            {x: 3, y: 4},
            {x: 5, y: 6},
            {x: 7, y: 8},
        ]);
        expect(helpers.annotationToDimensions(testAnnotation))
            .toEqual('6x6');
    });
});

describe('when annotationToCoordinate is called', () => {
    const testAnnotationFactory = (vertices) => ({
        boundingPoly: {
            vertices,
        },
    });
    it('should reduce the list of vertices to a string of tubles', () => {
        const testAnnotation = testAnnotationFactory([
            {x: 1, y: 2},
            {x: 3, y: 4},
            {x: 5, y: 6},
            {x: 7, y: 8},
        ]);
        expect(helpers.annotationToCoordinate(testAnnotation))
            .toEqual('+1+2');
    });
});
