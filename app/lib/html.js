import htm from 'htm';
import { createElement } from 'preact';
export default function html(tpls, ...args) {
    args = args.map(a => a.valueOf()); // so that stores will be reactive
    return htm.call(createElement, tpls, ...args);
}
