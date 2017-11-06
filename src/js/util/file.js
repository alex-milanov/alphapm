'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const fileSaver = require('file-saver');
// const jsZip = require("jszip");
const {fn, obj} = require("iblokz-data");

const load = (file, readAs = 'text') => $.create(stream => {
	const fr = new FileReader();
	fr.onload = function(ev) {
		// console.log(readAs, ev.target.result);
		stream.onNext(
			readAs === 'json'
				? JSON.parse(ev.target.result)
				: ev.target.result
		);
		stream.onCompleted();
	};
	// console.log(file, readAs);
	((typeof file === 'string')
		? $.fromPromise(fetch(file)).flatMap(res => res.blob())
		: $.just(file))
		.subscribe(f => fn.switch(readAs, {
			arrayBuffer: f => fr.readAsArrayBuffer(f),
			default: f => fr.readAsText(f)
		})(f));
});

const save = (fileName, content) => fileSaver.saveAs(
	new Blob([typeof content !== 'string' ? JSON.stringify(content) : content], {type: "text/plain;charset=utf-8"}),
	fileName
);

module.exports = {
	load,
	save
};
