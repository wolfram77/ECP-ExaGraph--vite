const fs = require('fs');
const os = require('os');
const path = require('path');

const RGRAPH = /^Loaded graph from file: .*\/(.*?)\.mtx/m;
const RORDER = /^Reading file of (.+?) vertices and (.+?) edges\./m;
const RMODLT = /^Level (.+?), Modularity: (.+?), Clustering time: (.+?), Iterations: (.+)/m;
const RRESLT = /^Average total time \(secs\.\): (.+)/m;
const RCLSTR = /^Average time for clustering \(secs\.\): (.+)/m;




// *-FILE
// ------

function readFile(pth) {
  var d = fs.readFileSync(pth, 'utf8');
  return d.replace(/\r?\n/g, '\n');
}

function writeFile(pth, d) {
  d = d.replace(/\r?\n/g, os.EOL);
  fs.writeFileSync(pth, d);
}




// *-CSV
// -----

function writeCsv(pth, rows) {
  var cols = Object.keys(rows[0]);
  var a = cols.join()+'\n';
  for (var r of rows)
    a += [...Object.values(r)].map(v => `"${v}"`).join()+'\n';
  writeFile(pth, a);
}




// *-LOG
// -----

function readLogLine(ln, data, state) {
  state = state || {};
  ln = ln.replace(/^\d+-\d+-\d+ \d+:\d+:\d+\s+/, '');
  if (RGRAPH.test(ln)) {
    var [, graph] = RGRAPH.exec(ln);
    if (!data.has(graph)) data.set(graph, []);
    state.graph = graph;
  }
  else if (RORDER.test(ln)) {
    var [, order, size] = RORDER.exec(ln);
    state.order = order;
    state.size  = size;
  }
  else if (RMODLT.test(ln)) {
    var [,, modularity] = RMODLT.exec(ln);
    state.modularity    = parseFloat(modularity);
  }
  else if (RRESLT.test(ln)) {
    var [, total_time] = RRESLT.exec(ln);
    state.total_time   = 1000 * parseFloat(total_time);
  }
  else if (RCLSTR.test(ln)) {
    var [, clustering_time] = RCLSTR.exec(ln);
    data.get(state.graph).push(Object.assign({}, state, {
      clustering_time: 1000 * parseFloat(clustering_time),
    }));
  }
  return state;
}

function readLog(pth) {
  var text  = readFile(pth);
  var lines = text.split('\n');
  var data  = new Map();
  var state = null;
  for (var ln of lines)
    state = readLogLine(ln, data, state);
  return data;
}




// PROCESS-*
// ---------

function processCsv(data) {
  var a = [];
  for (var rows of data.values())
    a.push(...rows);
  return a;
}




// MAIN
// ----

function main(cmd, log, out) {
  var data = readLog(log);
  if (path.extname(out)==='') cmd += '-dir';
  switch (cmd) {
    case 'csv':
      var rows = processCsv(data);
      writeCsv(out, rows);
      break;
    case 'csv-dir':
      for (var [graph, rows] of data)
        writeCsv(path.join(out, graph+'.csv'), rows);
      break;
    default:
      console.error(`error: "${cmd}"?`);
      break;
  }
}
main(...process.argv.slice(2));
