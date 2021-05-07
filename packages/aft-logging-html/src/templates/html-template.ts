import { HtmlResult } from "../html-file-manager";

class HtmlTemplate {
    private _template: string = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test Results</title>
<script src="https://code.jquery.com/jquery-3.6.0.min.js" integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css" integrity="sha384-B0vP5xmATw1+K9KRQjQERJvTumQW0nPEzvF6L/Z6nronJ3oUOFUFpCjEUQouq2+l" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.min.js" integrity="sha384-+YQ4JLhjyBLPDQt//I+STsc9iw4uQqACwlvpslubQzn4u2UU2UFM80nGisd026JF" crossorigin="anonymous"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css">
<script type="text/javascript" src="https://www.google.com/jsapi"></script>
<script type="text/javascript">
var notRun = 'notrun';
var failing = 'failing';
var passing = 'passing';

function showAll() {
    var rows = document.querySelectorAll('tr');
    toggleDisplayOfElements(rows, true);
    updateUrlParameter('');
}

function showOnlyPassing() {
    var passingRows = getPassingRows('html');
    var failingRows = getFailingRows('html');
    var notRunRows = getNotRunRows('html');
    toggleDisplayOfElements(passingRows, true);
    toggleDisplayOfElements(failingRows, false);
    toggleDisplayOfElements(notRunRows, false);
    updateUrlParameter(passing);
}
    
function showOnlyFailing() {
    var passingRows = getPassingRows('html');
    var failingRows = getFailingRows('html');
    var notRunRows = getNotRunRows('html');
    toggleDisplayOfElements(passingRows, false);
    toggleDisplayOfElements(failingRows, true);
    toggleDisplayOfElements(notRunRows, false);
    updateUrlParameter(failing);
}
    
function showOnlyNotRun() {
    var passingRows = getPassingRows('html');
    var failingRows = getFailingRows('html');
    var notRunRows = getNotRunRows('html');
    toggleDisplayOfElements(passingRows, false);
    toggleDisplayOfElements(failingRows, false);
    toggleDisplayOfElements(notRunRows, true);
    updateUrlParameter(notRun);
}

function toggleAllPanels(enable) {
    var panels = document.querySelectorAll('.card');
    for (var i=0; i<panels.length; i++) {
        var name = panels[i].getAttribute('name');
        toggleCard(name, enable);
    }
}

function toggleCard(name, enable) {
    if (name) {
        var panelHeader = document.querySelector("[name='" + name + "']");
        var panelBody = document.querySelector("[name='body-" + name + "']");
        if (panelBody) {
            var glyph = panelHeader.querySelector('.bi');
            if (enable == undefined) {
                // detect current state and toggle
                enable = false;
                if (glyph && glyph.classList.contains('bi-plus')) {
                    // display
                    enable = true;
                    glyph.classList.remove('bi-plus');
                    glyph.classList.add('bi-dash');
                } else {
                    // hide
                    enable = false;
                    glyph.classList.remove('bi-dash');
                    glyph.classList.add('bi-plus');
                }
            } else {
                // use passed in state no matter current state
                glyph.classList.remove('bi-plus');
                glyph.classList.remove('bi-dash');
                if (enable) {
                    glyph.classList.add('bi-dash');
                } else {
                    glyph.classList.add('bi-plus');
                }
            }
            toggleDisplayOfElements([panelBody], enable);
        }
    }
}

function toggleDisplayOfElements(elementArray, enable) {
    var re = new RegExp(/d-none/g);
    for (var i=0; i<elementArray.length; i++) {
        var row = elementArray[i];
        var classes = row.className;
        if (enable) {
            row.className = classes.replace(re, '');
        } else {
            row.className += " d-none";
        }
    }
}

function updateUrlParameter(param) {
    var url = window.location.href;
    if (url.indexOf('#') !== -1) {
        // remove existing param
        url = url.substring(0, url.indexOf('#'));
    }
    url += '#' + param;
    window.location.href = url;
}

function getUrlParameter() {
    var param = '';
    var url = window.location.href;
    if (url.indexOf('#') !== -1) {
        // remove existing param
        param = url.substring(url.indexOf('#') + 1, url.length);
    }
    return param;
}

function getPassingRows(selectorScope) {
    var passingRows = document.querySelectorAll(selectorScope + ' tr.passing');
    return passingRows;
}
    
function getFailingRows(selectorScope) {
    var failingRows = document.querySelectorAll(selectorScope + ' tr.failing');
    return failingRows;
}
    
function getNotRunRows(selectorScope) {
    var notRunRows = document.querySelectorAll(selectorScope + ' tr.notrun');
    return notRunRows;
}

function updateCounts(resultsScope, totalsScope) {
    var passing = getPassingRows(resultsScope).length;
    var failing = getFailingRows(resultsScope).length;
    var notRun = getNotRunRows(resultsScope).length;
    var pSpan = document.querySelector(totalsScope).querySelector('span.totalTestsPassing');
    var fSpan = document.querySelector(totalsScope).querySelector('span.totalTestsFailing');
    var nSpan = document.querySelector(totalsScope).querySelector('span.totalTestsNotRun');
    var tSpan = document.querySelector(totalsScope).querySelector('span.totalTests');
    
    pSpan.innerText = passing;
    fSpan.innerText = failing;
    nSpan.innerText = notRun;
    tSpan.innerText = passing + failing + notRun;
}

function parseUrlForDisplay() {
    var param = getUrlParameter();
    switch(param) {
        case notRun:
            showOnlyNotRun();
            break;
        case passing:
            showOnlyPassing();
            break;
        case failing:
            showOnlyFailing();
            break;
        default:
            showAll();
    }
}

function initialise(results) {
    if (results?.length) {
        for (var j=0; j<results.length; j++) {
            var result = results[j];
            addResult(result);
        }
    }

    updateCounts('html', '#summaryContainer');
    parseUrlForDisplay();
}

function addResult(result) {
    var passing = getTestsWithStatus(/(Passed)/gi, result).length;
    var failing = getTestsWithStatus(/(Failed|Retest)/gi, result).length;
    var notRun = getTestsWithStatus(/(Untested|Blocked|Skipped)/gi, result).length;
    var container = document.querySelector('#resultsContainer');
    var section = \`
<div class="card card-info" name="\${result.description}-ps-results">
    <div class="card-header p-0 bg-secondary d-flex justify-content-between flex-row text-light" onclick="toggleCard('\${result.description}-ps-results');">
        <div class="p-1"><i class="bi bi-dash" aria-hidden="true"></i></div>
        <div class="p-1 flex-grow-1"><span class="badge badge-default">Description:</span> \${result.description}</div>
        <div class="p-1"><span class="badge rounded-pill bg-primary totalTests">\${passing + failing + notRun}</span> <span class="badge bg-success totalTestsPassing">\${passing}</span> <span class="badge bg-danger totalTestsFailing">\${failing}</span> <span class="badge bg-warning totalTestsNotRun">\${notRun}</span></div>
    </div>
    <div class="card-body p-0" name="body-\${result.description}-ps-results"></div>
</div>
\`;
    container.innerHTML += section;
    var testContainer = document.querySelector(\`[name='body-\${result.description}-ps-results']\`);
    if (result.tests?.length) {
        addTests(testContainer, result.tests);
    }
}

function getTestsWithStatus(statusRegex, result) {
    var statusTests = [];
    if (result?.tests?.length) {
        for (var i=0; i<result.tests.length; i++) {
            var t = result.tests[i];
            if (t.status.match(statusRegex)?.length) {
                statusTests.push(t);
            }
        }
    }
    return statusTests;
}

function addTests(container, tests) {
    var startSection = \`
<table class="table table-striped table-hover">
    <thead>
        <tr><th>Test ID</th><th>Status</th><th>Logs</th></tr>
    </thead>
    <tbody>
\`;
    var testResultSection = '';
    for (var i=0; i<tests.length; i++) {
        var result = tests[i];
        var statusClass, trClass;
        switch (result.status) {
            case "Passed":
                statusClass = "success";
                trClass = "passing";
                break;
            case "Failed":
            case "Retest":
                statusClass = "danger";
                trClass = "failing";
                break;
            default:
                statusClass = "warning";
                trClass = "notrun";
                break;
        }
        testResultSection += \`
        <tr class="\${trClass}" name="\${result.testId}-pstt-results">
            <td class="id">
                \${result.testId}
            </td>
            <td class="status">
                <span class="badge badge-\${statusClass}">\${result.status}</span>
            </td>
            <td class="logs">
                \${result.logs.join('<br />')}
            </td>
        </tr>
\`;
    }
    var endSection = \`
    </tbody>
</table>
\`;
    container.innerHTML += startSection + testResultSection + endSection;
}

function drawChart() {
    var data = google.visualization.arrayToDataTable([
        ['Test Status', 'Count'],
        ['Pass', getPassingRows('html').length],
        ['Fail', getFailingRows('html').length],
        ['NotRun', getNotRunRows('html').length]
    ]);

    var options = {
        title: 'Test Summary',
        colors: ['#96d86d','#f48592','#f0ad4e']
    };

    var chart = new google.visualization.PieChart(document.getElementById('piechart'));

    chart.draw(data, options);
}
</script>
<style>
tbody tr td.ellide {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
div.vertical-align {
    display: flex;
    align-items: center;
}
.thumbnail img {
    height:50px;
}
.breakWrap {
    -ms-word-break: break-all;
    /* Be VERY careful with this, breaks normal words wh_erever */
    word-break: break-all;
    /* Non standard for webkit */
    /* ReSharper disable once InvalidValue */
    word-break: break-word;
    -webkit-hyphens: auto;
    -moz-hyphens: auto;
    hyphens: auto;
}
</style>
</head>
<body class="w-100">
    <div id="summaryContainer" class="container-fluid">
        <div class="row vertical-align">
            <div id="chartContainer" class="col-xs-8">
                <div id="piechart" style="width: 600px; height: 250px;"></div>
            </div>
            <div id="buttonContainer" class="col-xs-4">
                <div class="btn-group-vertical" role="group">
                    <button onclick="showOnlyPassing();" class="btn btn-success" type="button" title="click to show only passing tests">
                        PASSING <span class="badge totalTestsPassing">0</span>
                    </button>
                    <button onclick="showOnlyFailing();" class="btn btn-danger" type="button" title="click to show only failing tests">
                        FAILING <span class="badge totalTestsFailing">0</span>
                    </button>
                    <button onclick="showOnlyNotRun();" class="btn btn-warning" type="button" title="click to show only not run tests">
                        NOT RUN <span class="badge totalTestsNotRun">0</span>
                    </button>
                    <button onclick="showAll();" class="btn btn-primary" type="button" title="click to show all tests">
                        TOTAL <span class="badge totalTests">0</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div id="groupContainer" class="container-fluid">
        <div class="row">
            <button type="button" class="btn btn-info mx-1" onclick="toggleAllPanels(true);">Expand All <i class="bi-plus" aria-hidden="true"></i></button><button type="button" class="btn btn-info mx-1" onclick="toggleAllPanels(false);">Collapse All <i class="bi-dash" aria-hidden="true"></i></button>
        </div>
        <div class="row">
            <div class="m-1 w-100" id="resultsContainer"></div>
        </div>
    </div>
</body>
<script type="text/javascript">
google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(drawChart);
initialise({{inject_results_here}});
</script>
</html>
`;
    /**
     * 
     * @param results the full HTMl results file
     */
    emit(...results: HtmlResult[]) {
        return this._template.replace('{{inject_results_here}}', JSON.stringify(results));
    }
}

export const htmlTemplate = new HtmlTemplate();