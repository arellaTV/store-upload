global.WebSocket = require('ws');
window.URL.createObjectURL = () => {
  'http://fakeurl.wav'
};

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils'
import Dropstrip from '../src/scripts/components/dropstrip/Dropstrip';
import DropstripActions from '../src/scripts/components/dropstrip/dropstrip-actions';
import Dropzone from 'react-dropzone';
import _ from 'underscore';
import {expect, assert} from 'chai';
import sinon from 'sinon';
import sinonStubPromise from 'sinon-stub-promise';
import 'isomorphic-fetch';
import Flow from '@flowjs/flow.js';

sinonStubPromise(sinon);
const FlowFile = Flow.FlowFile;

describe('<Dropstrip />', function() {
  beforeEach(() => {
    this.component = TestUtils.renderIntoDocument(<Dropstrip />);
    this.stripDOM = ReactDOM.findDOMNode(this.component);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(this.stripDOM.parentNode);
  });

  const _dropInMockFiles = (filesToMock = 1) => {
    const files = [];
    _(filesToMock).times((n) => {
      files.push({
        name: `fakeFile_${n}.wav`,
        size: `12${n}`,
        type: 'application/x-moz-file'
      });
    });
    const mockEvent = {
      dataTransfer: {
        files
      }
    };
    TestUtils.Simulate.drop(this.stripDOM, mockEvent);
  };

  it('renders a Dropzone', () => {
    return expect(this.component, 'to have rendered', <Dropzone />);
  });

  it('shows dotted border when something dragged onto Dropstrip', () => {
    TestUtils.Simulate.dragEnter(this.stripDOM);
    expect(this.stripDOM.className).to.contain('upload__border--hover');
  });

  it('removes dotted border when thing is dragged off Dropstrip', () => {
    TestUtils.Simulate.dragEnter(this.stripDOM);
    TestUtils.Simulate.dragLeave(this.stripDOM);
    expect(this.stripDOM.className).not.to.contain('upload__border--hover');
  });

  it('renders QueuedItems when an files dropped into Dropstrip', () => {
    _dropInMockFiles();
    expect(TestUtils.scryRenderedDOMComponentsWithClass(this.component, 'queued-item').length).to.equal(1);
  });

  it('shows cancellation message when user clicks cancel on a queuedItem', () => {
    _dropInMockFiles();
    const cancelButton = TestUtils.findRenderedDOMComponentWithClass(this.component, 'queued-item__button--grey');
    expect(TestUtils.scryRenderedDOMComponentsWithClass(this.component, 'queued-item__prompt__centered').length).to.equal(0);

    TestUtils.Simulate.click(cancelButton);

    expect(TestUtils.findRenderedDOMComponentWithClass(this.component, 'queued-item__prompt__centered')).to.exist;
  });

  it('removes the queuedItem when user confirms cancel click', () => {
    _dropInMockFiles();
    TestUtils.Simulate.click(TestUtils.findRenderedDOMComponentWithClass(this.component, 'queued-item__button--grey'));
    const yesCancel = TestUtils.scryRenderedDOMComponentsWithClass(this.component, 'queued-item__button--yes')[0];

    TestUtils.Simulate.click(yesCancel);

    expect(TestUtils.scryRenderedDOMComponentsWithClass(this.component, 'queued-item').length).to.equal(0);
  });

  it('disables/enables the upload button depending on validity of title and contributor', () => {
    _dropInMockFiles();
    expect(TestUtils.scryRenderedDOMComponentsWithClass(this.component, 'upload-button')[0].disabled).to.be.true;

    const titleInput = TestUtils.findRenderedDOMComponentWithClass(this.component, 'title');
    const contributorInput = TestUtils.findRenderedDOMComponentWithClass(this.component, 'contributor');

    TestUtils.Simulate.change(titleInput, {target: {value: 'here is a title', name: 'title'}});
    TestUtils.Simulate.change(contributorInput, {target: {value: 'Contributor McPants', name: 'contributor'}});

    expect(TestUtils.scryRenderedDOMComponentsWithClass(this.component, 'upload-button')[0].disabled).to.be.false;
  });

  it('queries the server on fileDrop to check for existing file', () => {
    const stub = sinon.stub(global, 'fetch').returnsPromise().resolves();

    _dropInMockFiles();

    expect(stub.calledWith('http://localhost:3000/api/v1/audios?filename=fakeFile_0.wav')).to.be.true;
    stub.restore();
  });

  describe('on clicking upload', () => {
    beforeEach(() => {
      this.flowUploadStub = sinon.stub(Flow.prototype, 'upload');
      _dropInMockFiles();
      const titleInput = TestUtils.findRenderedDOMComponentWithClass(this.component, 'title');
      const contributorInput = TestUtils.findRenderedDOMComponentWithClass(this.component, 'contributor');

      TestUtils.Simulate.change(titleInput, {target: {value: 'here is a title', name: 'title'}});
      TestUtils.Simulate.change(contributorInput, {target: {value: 'Contributor McPants', name: 'contributor'}});
      TestUtils.Simulate.submit(TestUtils.findRenderedDOMComponentWithClass(this.component, 'form__queuedItem'));
    });

    afterEach(() => {
      this.flowUploadStub.restore();
    });

    it('shows a progress bar and pause button', () => {
      expect(TestUtils.findRenderedDOMComponentWithClass(this.component, 'progress-container__bar')).to.exist;
      expect(TestUtils.findRenderedDOMComponentWithClass(this.component, 'progress-container__button--pause'))
    });

    it('can pause and resume', () => {
      this.flowPauseStub = sinon.stub(FlowFile.prototype, 'pause');
      this.flowResumeStub = sinon.stub(FlowFile.prototype, 'resume');

      const pauseButton = TestUtils.findRenderedDOMComponentWithClass(this.component,
        'progress-container__button--pause');
      TestUtils.Simulate.click(pauseButton);

      assert(this.flowPauseStub.called, 'FlowFile.pause() was called');
      expect(TestUtils.findRenderedDOMComponentWithClass(this.component, 'paused-container')).to.exist;

      const resumeButton = TestUtils.findRenderedDOMComponentWithClass(this.component,
        'progress-container__button--resume');
      TestUtils.Simulate.click(resumeButton);

      assert(this.flowResumeStub.called, 'FlowFile.resume() was called');
      expect(TestUtils.findRenderedDOMComponentWithClass(this.component, 'uploading-container')).to.exist;

      this.flowPauseStub.restore();
      this.flowResumeStub.restore();
    });

    it('shows success', () => {
      const stub = sinon.stub(global, 'fetch').returnsPromise().resolves();

      DropstripActions.uploadSuccess('fakeFile_0.wav');
      expect(TestUtils.findRenderedDOMComponentWithClass(this.component, 'success-container')).to.exist;
      stub.restore();
    });

    it('cancels upload', () => {
      const cancelButton = TestUtils.findRenderedDOMComponentWithClass(this.component, 'queued-item__button--grey');
      TestUtils.Simulate.click(cancelButton);
      expect(TestUtils.findRenderedDOMComponentWithClass(this.component, 'queued-item__prompt__centered')).to.exist;
    });
  });
});


