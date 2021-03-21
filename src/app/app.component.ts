import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  outputStream: any;
  reader: any;
  logText: string = '';
  inputText: string = '';
  inputFieldDisabled = false;
  connectDisabled = false;
  myNavigator: any = navigator;
  notSupported = true;

  ngOnInit() {
    if ('serial' in navigator) {
      this.notSupported = false;
    }
  }

  writeToStream(line: any) {
    const writer = this.outputStream.getWriter();
    console.log('[SEND]', line);
    writer.write(line + '\r');
    writer.releaseLock();
  }

  async readLoop() {
    console.log('Readloop');

    while (true) {
      const { value, done } = await this.reader.read();
      console.log('value', value);
      console.log('done', done);

      if (value) {
        if (value[0] !== '{') {
          this.logText += value;
        } else {
          this.logText = value;
        }
        // this.log.scrollTop = this.log.scrollHeight;
      }
      if (done) {
        console.log('[readLoop] DONE', done);
        this.reader.releaseLock();
        break;
      }
    }
  }

  async connect() {
    const inputField = document.getElementById('input');
    this.inputFieldDisabled = false;
    // inputField.focus();
    // inputField.select();
    this.connectDisabled = true;

    const port = await this.myNavigator.serial.requestPort();
    // - Wait for the port to open.
    await port.open({ baudRate: 115200 });
    console.log('Open');

    let decoder = new TextDecoderStream();
    const inputDone = port.readable.pipeTo(decoder.writable);
    const inputStream = decoder.readable;

    const encoder = new TextEncoderStream();
    const outputDone = encoder.readable.pipeTo(port.writable);
    this.outputStream = encoder.writable;

    this.reader = inputStream.getReader();
    this.readLoop();
  }

  send() {
    const toSend = this.inputText;
    this.writeToStream(toSend);
    this.inputText = '';
  }

  onKey(e: any) {
    if (e.keyCode === 13) {
      e.preventDefault();
      this.send();
    }
  }
}
