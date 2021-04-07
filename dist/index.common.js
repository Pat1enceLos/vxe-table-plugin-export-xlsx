"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.VXETablePluginExportXLSX = void 0;

var _xeUtils = _interopRequireDefault(require("xe-utils"));

var _exceljs = _interopRequireDefault(require("exceljs"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var vxetable;
var defaultHeaderBackgroundColor = 'f8f8f9';
var defaultCellFontColor = '606266';
var defaultCellBorderStyle = 'thin';
var defaultCellBorderColor = 'e8eaec';

function getCellLabel(column, cellValue) {
  if (cellValue) {
    switch (column.cellType) {
      case 'string':
        return _xeUtils["default"].toValueString(cellValue);

      case 'number':
        if (!isNaN(cellValue)) {
          return Number(cellValue);
        }

        break;

      default:
        if (cellValue.length < 12 && !isNaN(cellValue)) {
          return Number(cellValue);
        }

        break;
    }
  }

  return cellValue;
}

function getFooterData(opts, footerData) {
  var footerFilterMethod = opts.footerFilterMethod;
  return footerFilterMethod ? footerData.filter(function (items, index) {
    return footerFilterMethod({
      items: items,
      $rowIndex: index
    });
  }) : footerData;
}

function getFooterCellValue($table, opts, rows, column) {
  var cellValue = getCellLabel(column, rows[$table.getVMColumnIndex(column)]);
  return cellValue;
}

function getValidColumn(column) {
  var childNodes = column.childNodes;
  var isColGroup = childNodes && childNodes.length;

  if (isColGroup) {
    return getValidColumn(childNodes[0]);
  }

  return column;
}

function setExcelRowHeight(excelRow, height) {
  if (height) {
    excelRow.height = _xeUtils["default"].floor(height * 0.75, 12);
  }
}

function setExcelCellStyle(excelCell, align) {
  excelCell.protection = {
    locked: false
  };
  excelCell.alignment = {
    vertical: 'middle',
    horizontal: align || 'left'
  };
}

function getDefaultBorderStyle() {
  return {
    top: {
      style: defaultCellBorderStyle,
      color: {
        argb: defaultCellBorderColor
      }
    },
    left: {
      style: defaultCellBorderStyle,
      color: {
        argb: defaultCellBorderColor
      }
    },
    bottom: {
      style: defaultCellBorderStyle,
      color: {
        argb: defaultCellBorderColor
      }
    },
    right: {
      style: defaultCellBorderStyle,
      color: {
        argb: defaultCellBorderColor
      }
    }
  };
}

function exportXLSX(params) {
  var msgKey = 'xlsx';
  var $table = params.$table,
      options = params.options,
      columns = params.columns,
      colgroups = params.colgroups,
      datas = params.datas;
  var props = $table.props,
      reactData = $table.reactData;
  var allHeaderAlign = props.headerAlign,
      allAlign = props.align,
      allFooterAlign = props.footerAlign;
  var rowHeight = reactData.rowHeight;
  var message = options.message,
      sheetName = options.sheetName,
      isHeader = options.isHeader,
      isFooter = options.isFooter,
      isMerge = options.isMerge,
      isColgroup = options.isColgroup,
      original = options.original,
      useStyle = options.useStyle,
      sheetMethod = options.sheetMethod;
  var showMsg = message !== false;
  var mergeCells = $table.getMergeCells();
  var colList = [];
  var footList = [];
  var sheetCols = [];
  var sheetMerges = [];
  var beforeRowCount = 0;
  var colHead = {};
  columns.forEach(function (column) {
    var id = column.id,
        property = column.property,
        renderWidth = column.renderWidth;
    colHead[id] = original ? property : column.getTitle();
    sheetCols.push({
      key: id,
      width: _xeUtils["default"].ceil(renderWidth / 8, 1)
    });
  }); // 处理表头

  if (isHeader) {
    // 处理分组
    if (isColgroup && !original && colgroups) {
      colgroups.forEach(function (cols, rIndex) {
        var groupHead = {};
        columns.forEach(function (column) {
          groupHead[column.id] = null;
        });
        cols.forEach(function (column) {
          var _colSpan = column._colSpan,
              _rowSpan = column._rowSpan;
          var validColumn = getValidColumn(column);
          var columnIndex = columns.indexOf(validColumn);
          groupHead[validColumn.id] = original ? validColumn.property : column.getTitle();

          if (_colSpan > 1 || _rowSpan > 1) {
            sheetMerges.push({
              s: {
                r: rIndex,
                c: columnIndex
              },
              e: {
                r: rIndex + _rowSpan - 1,
                c: columnIndex + _colSpan - 1
              }
            });
          }
        });
        colList.push(groupHead);
      });
    } else {
      colList.push(colHead);
    }

    beforeRowCount += colList.length;
  } // 处理合并


  if (isMerge && !original) {
    mergeCells.forEach(function (mergeItem) {
      var mergeRowIndex = mergeItem.row,
          mergeRowspan = mergeItem.rowspan,
          mergeColIndex = mergeItem.col,
          mergeColspan = mergeItem.colspan;
      sheetMerges.push({
        s: {
          r: mergeRowIndex + beforeRowCount,
          c: mergeColIndex
        },
        e: {
          r: mergeRowIndex + beforeRowCount + mergeRowspan - 1,
          c: mergeColIndex + mergeColspan - 1
        }
      });
    });
  }

  var rowList = datas.map(function (item) {
    var rest = {};
    columns.forEach(function (column) {
      rest[column.id] = getCellLabel(column, item[column.id]);
    });
    return rest;
  });
  beforeRowCount += rowList.length; // 处理表尾

  if (isFooter) {
    var _$table$getTableData = $table.getTableData(),
        footerData = _$table$getTableData.footerData;

    var footers = getFooterData(options, footerData);
    var mergeFooterItems = $table.getMergeFooterItems(); // 处理合并

    if (isMerge && !original) {
      mergeFooterItems.forEach(function (mergeItem) {
        var mergeRowIndex = mergeItem.row,
            mergeRowspan = mergeItem.rowspan,
            mergeColIndex = mergeItem.col,
            mergeColspan = mergeItem.colspan;
        sheetMerges.push({
          s: {
            r: mergeRowIndex + beforeRowCount,
            c: mergeColIndex
          },
          e: {
            r: mergeRowIndex + beforeRowCount + mergeRowspan - 1,
            c: mergeColIndex + mergeColspan - 1
          }
        });
      });
    }

    footers.forEach(function (rows) {
      var item = {};
      columns.forEach(function (column) {
        item[column.id] = getFooterCellValue($table, options, rows, column);
      });
      footList.push(item);
    });
  }

  var exportMethod = function exportMethod() {
    var workbook = new _exceljs["default"].Workbook();
    var sheet = workbook.addWorksheet(sheetName);
    workbook.creator = 'vxe-table';
    sheet.columns = sheetCols;

    if (isHeader) {
      sheet.addRows(colList).forEach(function (excelRow) {
        if (useStyle) {
          setExcelRowHeight(excelRow, rowHeight);
        }

        excelRow.eachCell(function (excelCell) {
          var excelCol = sheet.getColumn(excelCell.col);
          var column = $table.getColumnById(excelCol.key);
          var headerAlign = column.headerAlign,
              align = column.align;
          setExcelCellStyle(excelCell, headerAlign || align || allHeaderAlign || allAlign);

          if (useStyle) {
            Object.assign(excelCell, {
              font: {
                bold: true,
                color: {
                  argb: defaultCellFontColor
                }
              },
              fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                  argb: defaultHeaderBackgroundColor
                }
              },
              border: getDefaultBorderStyle()
            });
          }
        });
      });
    }

    sheet.addRows(rowList).forEach(function (excelRow) {
      if (useStyle) {
        setExcelRowHeight(excelRow, rowHeight);
      }

      excelRow.eachCell(function (excelCell) {
        var excelCol = sheet.getColumn(excelCell.col);
        var column = $table.getColumnById(excelCol.key);
        var align = column.align;
        setExcelCellStyle(excelCell, align || allAlign);

        if (useStyle) {
          Object.assign(excelCell, {
            font: {
              color: {
                argb: defaultCellFontColor
              }
            },
            border: getDefaultBorderStyle()
          });
        }
      });
    });

    if (isFooter) {
      sheet.addRows(footList).forEach(function (excelRow) {
        if (useStyle) {
          setExcelRowHeight(excelRow, rowHeight);
        }

        excelRow.eachCell(function (excelCell) {
          var excelCol = sheet.getColumn(excelCell.col);
          var column = $table.getColumnById(excelCol.key);
          var footerAlign = column.footerAlign,
              align = column.align;
          setExcelCellStyle(excelCell, footerAlign || align || allFooterAlign || allAlign);

          if (useStyle) {
            Object.assign(excelCell, {
              font: {
                color: {
                  argb: defaultCellFontColor
                }
              },
              border: getDefaultBorderStyle()
            });
          }
        });
      });
    }

    if (useStyle && sheetMethod) {
      sheetMethod({
        options: options,
        workbook: workbook,
        worksheet: sheet,
        columns: columns,
        colgroups: colgroups,
        datas: datas,
        $table: $table
      });
    }

    sheetMerges.forEach(function (_ref) {
      var s = _ref.s,
          e = _ref.e;
      sheet.mergeCells(s.r + 1, s.c + 1, e.r + 1, e.c + 1);
    });
    workbook.xlsx.writeBuffer().then(function (buffer) {
      var blob = new Blob([buffer], {
        type: 'application/octet-stream'
      }); // 导出 xlsx

      downloadFile(params, blob, options);

      if (showMsg) {
        vxetable.modal.close(msgKey);
        vxetable.modal.message({
          message: vxetable.t('vxe.table.expSuccess'),
          status: 'success'
        });
      }
    });
  };

  if (showMsg) {
    vxetable.modal.message({
      id: msgKey,
      message: vxetable.t('vxe.table.expLoading'),
      status: 'loading',
      duration: -1
    });
    setTimeout(exportMethod, 1500);
  } else {
    exportMethod();
  }
}

function downloadFile(params, blob, options) {
  var message = options.message,
      filename = options.filename,
      type = options.type;
  var showMsg = message !== false;

  if (window.Blob) {
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, "".concat(filename, ".").concat(type));
    } else {
      var linkElem = document.createElement('a');
      linkElem.target = '_blank';
      linkElem.download = "".concat(filename, ".").concat(type);
      linkElem.href = URL.createObjectURL(blob);
      document.body.appendChild(linkElem);
      linkElem.click();
      document.body.removeChild(linkElem);
    }
  } else {
    if (showMsg) {
      vxetable.modal.alert({
        message: vxetable.t('vxe.error.notExp'),
        status: 'error'
      });
    }
  }
}

function checkImportData(tableFields, fields) {
  return fields.some(function (field) {
    return tableFields.indexOf(field) > -1;
  });
}

function importError(params) {
  var $table = params.$table,
      options = params.options;
  var internalData = $table.internalData;
  var _importReject = internalData._importReject;
  var showMsg = options.message !== false;

  if (showMsg) {
    vxetable.modal.message({
      message: vxetable.t('vxe.error.impFields'),
      status: 'error'
    });
  }

  if (_importReject) {
    _importReject({
      status: false
    });
  }
}

function importXLSX(params) {
  var $table = params.$table,
      columns = params.columns,
      options = params.options,
      file = params.file;
  var internalData = $table.internalData;
  var _importResolve = internalData._importResolve;
  var showMsg = options.message !== false;
  var fileReader = new FileReader();

  fileReader.onerror = function () {
    importError(params);
  };

  fileReader.onload = function (evnt) {
    var tableFields = [];
    columns.forEach(function (column) {
      var field = column.property;

      if (field) {
        tableFields.push(field);
      }
    });
    var workbook = new _exceljs["default"].Workbook();
    var readerTarget = evnt.target;

    if (readerTarget) {
      workbook.xlsx.load(readerTarget.result).then(function (wb) {
        var firstSheet = wb.worksheets[0];

        if (firstSheet) {
          var sheetValues = firstSheet.getSheetValues();

          var fieldIndex = _xeUtils["default"].findIndexOf(sheetValues, function (list) {
            return list && list.length > 0;
          });

          var fields = sheetValues[fieldIndex];
          var status = checkImportData(tableFields, fields);

          if (status) {
            var records = sheetValues.slice(fieldIndex).map(function (list) {
              var item = {};
              list.forEach(function (cellValue, cIndex) {
                item[fields[cIndex]] = cellValue;
              });
              var record = {};
              tableFields.forEach(function (field) {
                record[field] = _xeUtils["default"].isUndefined(item[field]) ? null : item[field];
              });
              return record;
            });
            $table.createData(records).then(function (data) {
              var loadRest;

              if (options.mode === 'insert') {
                loadRest = $table.insertAt(data, -1);
              } else {
                loadRest = $table.reloadData(data);
              }

              return loadRest.then(function () {
                if (_importResolve) {
                  _importResolve({
                    status: true
                  });
                }
              });
            });

            if (showMsg) {
              vxetable.modal.message({
                message: vxetable.t('vxe.table.impSuccess', [records.length]),
                status: 'success'
              });
            }
          } else {
            importError(params);
          }
        } else {
          importError(params);
        }
      });
    } else {
      importError(params);
    }
  };

  fileReader.readAsArrayBuffer(file);
}

function handleImportEvent(params) {
  if (params.options.type === 'xlsx') {
    importXLSX(params);
    return false;
  }
}

function handleExportEvent(params) {
  if (params.options.type === 'xlsx') {
    exportXLSX(params);
    return false;
  }
}
/**
 * 基于 vxe-table 表格的增强插件，支持导出 xlsx 格式
 */


var VXETablePluginExportXLSX = {
  install: function install(vxetablecore) {
    var setup = vxetablecore.setup,
        interceptor = vxetablecore.interceptor;
    vxetable = vxetablecore;
    setup({
      "export": {
        types: {
          xlsx: 0
        }
      }
    });
    interceptor.mixin({
      'event.import': handleImportEvent,
      'event.export': handleExportEvent
    });
  }
};
exports.VXETablePluginExportXLSX = VXETablePluginExportXLSX;

if (typeof window !== 'undefined' && window.VXETable) {
  window.VXETable.use(VXETablePluginExportXLSX);
}

var _default = VXETablePluginExportXLSX;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIiwiaW5kZXguanMiXSwibmFtZXMiOlsidnhldGFibGUiLCJkZWZhdWx0SGVhZGVyQmFja2dyb3VuZENvbG9yIiwiZGVmYXVsdENlbGxGb250Q29sb3IiLCJkZWZhdWx0Q2VsbEJvcmRlclN0eWxlIiwiZGVmYXVsdENlbGxCb3JkZXJDb2xvciIsImdldENlbGxMYWJlbCIsImNvbHVtbiIsImNlbGxWYWx1ZSIsImNlbGxUeXBlIiwiWEVVdGlscyIsInRvVmFsdWVTdHJpbmciLCJpc05hTiIsIk51bWJlciIsImxlbmd0aCIsImdldEZvb3RlckRhdGEiLCJvcHRzIiwiZm9vdGVyRGF0YSIsImZvb3RlckZpbHRlck1ldGhvZCIsImZpbHRlciIsIml0ZW1zIiwiaW5kZXgiLCIkcm93SW5kZXgiLCJnZXRGb290ZXJDZWxsVmFsdWUiLCIkdGFibGUiLCJyb3dzIiwiZ2V0Vk1Db2x1bW5JbmRleCIsImdldFZhbGlkQ29sdW1uIiwiY2hpbGROb2RlcyIsImlzQ29sR3JvdXAiLCJzZXRFeGNlbFJvd0hlaWdodCIsImV4Y2VsUm93IiwiaGVpZ2h0IiwiZmxvb3IiLCJzZXRFeGNlbENlbGxTdHlsZSIsImV4Y2VsQ2VsbCIsImFsaWduIiwicHJvdGVjdGlvbiIsImxvY2tlZCIsImFsaWdubWVudCIsInZlcnRpY2FsIiwiaG9yaXpvbnRhbCIsImdldERlZmF1bHRCb3JkZXJTdHlsZSIsInRvcCIsInN0eWxlIiwiY29sb3IiLCJhcmdiIiwibGVmdCIsImJvdHRvbSIsInJpZ2h0IiwiZXhwb3J0WExTWCIsInBhcmFtcyIsIm1zZ0tleSIsIm9wdGlvbnMiLCJjb2x1bW5zIiwiY29sZ3JvdXBzIiwiZGF0YXMiLCJwcm9wcyIsInJlYWN0RGF0YSIsImFsbEhlYWRlckFsaWduIiwiaGVhZGVyQWxpZ24iLCJhbGxBbGlnbiIsImFsbEZvb3RlckFsaWduIiwiZm9vdGVyQWxpZ24iLCJyb3dIZWlnaHQiLCJtZXNzYWdlIiwic2hlZXROYW1lIiwiaXNIZWFkZXIiLCJpc0Zvb3RlciIsImlzTWVyZ2UiLCJpc0NvbGdyb3VwIiwib3JpZ2luYWwiLCJ1c2VTdHlsZSIsInNoZWV0TWV0aG9kIiwic2hvd01zZyIsIm1lcmdlQ2VsbHMiLCJnZXRNZXJnZUNlbGxzIiwiY29sTGlzdCIsImZvb3RMaXN0Iiwic2hlZXRDb2xzIiwic2hlZXRNZXJnZXMiLCJiZWZvcmVSb3dDb3VudCIsImNvbEhlYWQiLCJmb3JFYWNoIiwiaWQiLCJwcm9wZXJ0eSIsInJlbmRlcldpZHRoIiwiZ2V0VGl0bGUiLCJwdXNoIiwia2V5Iiwid2lkdGgiLCJjZWlsIiwiY29scyIsInJJbmRleCIsImdyb3VwSGVhZCIsIl9jb2xTcGFuIiwiX3Jvd1NwYW4iLCJ2YWxpZENvbHVtbiIsImNvbHVtbkluZGV4IiwiaW5kZXhPZiIsInMiLCJyIiwiYyIsImUiLCJtZXJnZUl0ZW0iLCJtZXJnZVJvd0luZGV4Iiwicm93IiwibWVyZ2VSb3dzcGFuIiwicm93c3BhbiIsIm1lcmdlQ29sSW5kZXgiLCJjb2wiLCJtZXJnZUNvbHNwYW4iLCJjb2xzcGFuIiwicm93TGlzdCIsIm1hcCIsIml0ZW0iLCJyZXN0IiwiZ2V0VGFibGVEYXRhIiwiZm9vdGVycyIsIm1lcmdlRm9vdGVySXRlbXMiLCJnZXRNZXJnZUZvb3Rlckl0ZW1zIiwiZXhwb3J0TWV0aG9kIiwid29ya2Jvb2siLCJFeGNlbEpTIiwiV29ya2Jvb2siLCJzaGVldCIsImFkZFdvcmtzaGVldCIsImNyZWF0b3IiLCJhZGRSb3dzIiwiZWFjaENlbGwiLCJleGNlbENvbCIsImdldENvbHVtbiIsImdldENvbHVtbkJ5SWQiLCJPYmplY3QiLCJhc3NpZ24iLCJmb250IiwiYm9sZCIsImZpbGwiLCJ0eXBlIiwicGF0dGVybiIsImZnQ29sb3IiLCJib3JkZXIiLCJ3b3Jrc2hlZXQiLCJ4bHN4Iiwid3JpdGVCdWZmZXIiLCJ0aGVuIiwiYnVmZmVyIiwiYmxvYiIsIkJsb2IiLCJkb3dubG9hZEZpbGUiLCJtb2RhbCIsImNsb3NlIiwidCIsInN0YXR1cyIsImR1cmF0aW9uIiwic2V0VGltZW91dCIsImZpbGVuYW1lIiwid2luZG93IiwibmF2aWdhdG9yIiwibXNTYXZlQmxvYiIsImxpbmtFbGVtIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwidGFyZ2V0IiwiZG93bmxvYWQiLCJocmVmIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwiYm9keSIsImFwcGVuZENoaWxkIiwiY2xpY2siLCJyZW1vdmVDaGlsZCIsImFsZXJ0IiwiY2hlY2tJbXBvcnREYXRhIiwidGFibGVGaWVsZHMiLCJmaWVsZHMiLCJzb21lIiwiZmllbGQiLCJpbXBvcnRFcnJvciIsImludGVybmFsRGF0YSIsIl9pbXBvcnRSZWplY3QiLCJpbXBvcnRYTFNYIiwiZmlsZSIsIl9pbXBvcnRSZXNvbHZlIiwiZmlsZVJlYWRlciIsIkZpbGVSZWFkZXIiLCJvbmVycm9yIiwib25sb2FkIiwiZXZudCIsInJlYWRlclRhcmdldCIsImxvYWQiLCJyZXN1bHQiLCJ3YiIsImZpcnN0U2hlZXQiLCJ3b3Jrc2hlZXRzIiwic2hlZXRWYWx1ZXMiLCJnZXRTaGVldFZhbHVlcyIsImZpZWxkSW5kZXgiLCJmaW5kSW5kZXhPZiIsImxpc3QiLCJyZWNvcmRzIiwic2xpY2UiLCJjSW5kZXgiLCJyZWNvcmQiLCJpc1VuZGVmaW5lZCIsImNyZWF0ZURhdGEiLCJkYXRhIiwibG9hZFJlc3QiLCJtb2RlIiwiaW5zZXJ0QXQiLCJyZWxvYWREYXRhIiwicmVhZEFzQXJyYXlCdWZmZXIiLCJoYW5kbGVJbXBvcnRFdmVudCIsImhhbmRsZUV4cG9ydEV2ZW50IiwiVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYIiwiaW5zdGFsbCIsInZ4ZXRhYmxlY29yZSIsInNldHVwIiwiaW50ZXJjZXB0b3IiLCJ0eXBlcyIsIm1peGluIiwiVlhFVGFibGUiLCJ1c2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFRQTs7OztBQUVBLElBQUlBLFFBQUo7QUFpQkEsSUFBTUMsNEJBQTRCLEdBQUcsUUFBckM7QUFDQSxJQUFNQyxvQkFBb0IsR0FBRyxRQUE3QjtB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LEdBQWhCLENBQW9CUix3QkFBcEI7QUFDRDs7ZUFFY0Esd0IiLCJmaWxlIjoiaW5kZXguY29tbW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFhFVXRpbHMgZnJvbSAneGUtdXRpbHMnXG5pbXBvcnQge1xuICBWWEVUYWJsZUNvcmUsXG4gIFZ4ZVRhYmxlQ29uc3RydWN0b3IsXG4gIFZ4ZVRhYmxlUHJvcFR5cGVzLFxuICBWeGVUYWJsZURlZmluZXMsXG4gIFZ4ZUdsb2JhbEludGVyY2VwdG9ySGFuZGxlc1xufSBmcm9tICdAb2EvdnhlLXRhYmxlJ1xuaW1wb3J0IEV4Y2VsSlMgZnJvbSAnZXhjZWxqcydcblxubGV0IHZ4ZXRhYmxlOlZYRVRhYmxlQ29yZVxuXG5kZWNsYXJlIG1vZHVsZSAnQG9hL3Z4ZS10YWJsZScge1xuICBuYW1lc3BhY2UgVnhlVGFibGVEZWZpbmVzIHtcbiAgICBpbnRlcmZhY2UgRXh0b3J0U2hlZXRNZXRob2RQYXJhbXMge1xuICAgICAgd29ya2Jvb2s6IEV4Y2VsSlMuV29ya2Jvb2s7XG4gICAgICB3b3Jrc2hlZXQ6IEV4Y2VsSlMuV29ya3NoZWV0O1xuICAgIH1cbiAgICBpbnRlcmZhY2UgQ29sdW1uSW5mbyB7XG4gICAgICBfcm93OiBhbnk7XG4gICAgICBfY29sU3BhbjogbnVtYmVyO1xuICAgICAgX3Jvd1NwYW46IG51bWJlcjtcbiAgICAgIGNoaWxkTm9kZXM6IFZ4ZVRhYmxlRGVmaW5lcy5Db2x1bW5JbmZvW107XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IGRlZmF1bHRIZWFkZXJCYWNrZ3JvdW5kQ29sb3IgPSAnZjhmOGY5J1xuY29uc3QgZGVmYXVsdENlbGxGb250Q29sb3IgPSAnNjA2MjY2J1xuY29uc3QgZGVmYXVsdENlbGxCb3JkZXJTdHlsZSA9ICd0aGluJ1xuY29uc3QgZGVmYXVsdENlbGxCb3JkZXJDb2xvciA9ICdlOGVhZWMnXG5cbmZ1bmN0aW9uIGdldENlbGxMYWJlbCAoY29sdW1uOiBWeGVUYWJsZURlZmluZXMuQ29sdW1uSW5mbywgY2VsbFZhbHVlOiBhbnkpIHtcbiAgaWYgKGNlbGxWYWx1ZSkge1xuICAgIHN3aXRjaCAoY29sdW1uLmNlbGxUeXBlKSB7XG4gICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICByZXR1cm4gWEVVdGlscy50b1ZhbHVlU3RyaW5nKGNlbGxWYWx1ZSlcbiAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIGlmICghaXNOYU4oY2VsbFZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBOdW1iZXIoY2VsbFZhbHVlKVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAoY2VsbFZhbHVlLmxlbmd0aCA8IDEyICYmICFpc05hTihjZWxsVmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIE51bWJlcihjZWxsVmFsdWUpXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNlbGxWYWx1ZVxufVxuXG5mdW5jdGlvbiBnZXRGb290ZXJEYXRhIChvcHRzOiBWeGVUYWJsZVByb3BUeXBlcy5FeHBvcnRDb25maWcsIGZvb3RlckRhdGE6IGFueVtdW10pIHtcbiAgY29uc3QgeyBmb290ZXJGaWx0ZXJNZXRob2QgfSA9IG9wdHNcbiAgcmV0dXJuIGZvb3RlckZpbHRlck1ldGhvZCA/IGZvb3RlckRhdGEuZmlsdGVyKChpdGVtcywgaW5kZXgpID0+IGZvb3RlckZpbHRlck1ldGhvZCh7IGl0ZW1zLCAkcm93SW5kZXg6IGluZGV4IH0pKSA6IGZvb3RlckRhdGFcbn1cblxuZnVuY3Rpb24gZ2V0Rm9vdGVyQ2VsbFZhbHVlICgkdGFibGU6IFZ4ZVRhYmxlQ29uc3RydWN0b3IsIG9wdHM6IFZ4ZVRhYmxlUHJvcFR5cGVzLkV4cG9ydENvbmZpZywgcm93czogYW55W10sIGNvbHVtbjogVnhlVGFibGVEZWZpbmVzLkNvbHVtbkluZm8pIHtcbiAgY29uc3QgY2VsbFZhbHVlID0gZ2V0Q2VsbExhYmVsKGNvbHVtbiwgcm93c1skdGFibGUuZ2V0Vk1Db2x1bW5JbmRleChjb2x1bW4pXSlcbiAgcmV0dXJuIGNlbGxWYWx1ZVxufVxuXG5mdW5jdGlvbiBnZXRWYWxpZENvbHVtbiAoY29sdW1uOiBWeGVUYWJsZURlZmluZXMuQ29sdW1uSW5mbyk6IFZ4ZVRhYmxlRGVmaW5lcy5Db2x1bW5JbmZvIHtcbiAgY29uc3QgeyBjaGlsZE5vZGVzIH0gPSBjb2x1bW5cbiAgY29uc3QgaXNDb2xHcm91cCA9IGNoaWxkTm9kZXMgJiYgY2hpbGROb2Rlcy5sZW5ndGhcbiAgaWYgKGlzQ29sR3JvdXApIHtcbiAgICByZXR1cm4gZ2V0VmFsaWRDb2x1bW4oY2hpbGROb2Rlc1swXSlcbiAgfVxuICByZXR1cm4gY29sdW1uXG59XG5cbmZ1bmN0aW9uIHNldEV4Y2VsUm93SGVpZ2h0IChleGNlbFJvdzogRXhjZWxKUy5Sb3csIGhlaWdodDogbnVtYmVyKSB7XG4gIGlmIChoZWlnaHQpIHtcbiAgICBleGNlbFJvdy5oZWlnaHQgPSBYRVV0aWxzLmZsb29yKGhlaWdodCAqIDAuNzUsIDEyKVxuICB9XG59XG5cbmZ1bmN0aW9uIHNldEV4Y2VsQ2VsbFN0eWxlIChleGNlbENlbGw6IEV4Y2VsSlMuQ2VsbCwgYWxpZ24/OiBWeGVUYWJsZVByb3BUeXBlcy5BbGlnbiB8IFZ4ZVRhYmxlUHJvcFR5cGVzLkhlYWRlckFsaWduIHwgVnhlVGFibGVQcm9wVHlwZXMuRm9vdGVyQWxpZ24pIHtcbiAgZXhjZWxDZWxsLnByb3RlY3Rpb24gPSB7XG4gICAgbG9ja2VkOiBmYWxzZVxuICB9XG4gIGV4Y2VsQ2VsbC5hbGlnbm1lbnQgPSB7XG4gICAgdmVydGljYWw6ICdtaWRkbGUnLFxuICAgIGhvcml6b250YWw6IGFsaWduIHx8ICdsZWZ0J1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldERlZmF1bHRCb3JkZXJTdHlsZSAoKSB7XG4gIHJldHVybiB7XG4gICAgdG9wOiB7XG4gICAgICBzdHlsZTogZGVmYXVsdENlbGxCb3JkZXJTdHlsZSxcbiAgICAgIGNvbG9yOiB7XG4gICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcbiAgICAgIH1cbiAgICB9LFxuICAgIGxlZnQ6IHtcbiAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxuICAgICAgY29sb3I6IHtcbiAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxuICAgICAgfVxuICAgIH0sXG4gICAgYm90dG9tOiB7XG4gICAgICBzdHlsZTogZGVmYXVsdENlbGxCb3JkZXJTdHlsZSxcbiAgICAgIGNvbG9yOiB7XG4gICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcbiAgICAgIH1cbiAgICB9LFxuICAgIHJpZ2h0OiB7XG4gICAgICBzdHlsZTogZGVmYXVsdENlbGxCb3JkZXJTdHlsZSxcbiAgICAgIGNvbG9yOiB7XG4gICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhwb3J0WExTWCAocGFyYW1zOiBWeGVHbG9iYWxJbnRlcmNlcHRvckhhbmRsZXMuSW50ZXJjZXB0b3JFeHBvcnRQYXJhbXMpIHtcbiAgY29uc3QgbXNnS2V5ID0gJ3hsc3gnXG4gIGNvbnN0IHsgJHRhYmxlLCBvcHRpb25zLCBjb2x1bW5zLCBjb2xncm91cHMsIGRhdGFzIH0gPSBwYXJhbXNcbiAgY29uc3QgeyBwcm9wcywgcmVhY3REYXRhIH0gPSAkdGFibGVcbiAgY29uc3QgeyBoZWFkZXJBbGlnbjogYWxsSGVhZGVyQWxpZ24sIGFsaWduOiBhbGxBbGlnbiwgZm9vdGVyQWxpZ246IGFsbEZvb3RlckFsaWduIH0gPSBwcm9wc1xuICBjb25zdCB7IHJvd0hlaWdodCB9ID0gcmVhY3REYXRhXG4gIGNvbnN0IHsgbWVzc2FnZSwgc2hlZXROYW1lLCBpc0hlYWRlciwgaXNGb290ZXIsIGlzTWVyZ2UsIGlzQ29sZ3JvdXAsIG9yaWdpbmFsLCB1c2VTdHlsZSwgc2hlZXRNZXRob2QgfSA9IG9wdGlvbnNcbiAgY29uc3Qgc2hvd01zZyA9IG1lc3NhZ2UgIT09IGZhbHNlXG4gIGNvbnN0IG1lcmdlQ2VsbHMgPSAkdGFibGUuZ2V0TWVyZ2VDZWxscygpXG4gIGNvbnN0IGNvbExpc3Q6IGFueVtdID0gW11cbiAgY29uc3QgZm9vdExpc3Q6IGFueVtdID0gW11cbiAgY29uc3Qgc2hlZXRDb2xzOiBhbnlbXSA9IFtdXG4gIGNvbnN0IHNoZWV0TWVyZ2VzOiB7IHM6IHsgcjogbnVtYmVyLCBjOiBudW1iZXIgfSwgZTogeyByOiBudW1iZXIsIGM6IG51bWJlciB9IH1bXSA9IFtdXG4gIGxldCBiZWZvcmVSb3dDb3VudCA9IDBcbiAgY29uc3QgY29sSGVhZDogYW55ID0ge31cbiAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICBjb25zdCB7IGlkLCBwcm9wZXJ0eSwgcmVuZGVyV2lkdGggfSA9IGNvbHVtblxuICAgIGNvbEhlYWRbaWRdID0gb3JpZ2luYWwgPyBwcm9wZXJ0eSA6IGNvbHVtbi5nZXRUaXRsZSgpXG4gICAgc2hlZXRDb2xzLnB1c2goe1xuICAgICAga2V5OiBpZCxcbiAgICAgIHdpZHRoOiBYRVV0aWxzLmNlaWwocmVuZGVyV2lkdGggLyA4LCAxKVxuICAgIH0pXG4gIH0pXG4gIC8vIOWkhOeQhuihqOWktFxuICBpZiAoaXNIZWFkZXIpIHtcbiAgICAvLyDlpITnkIbliIbnu4RcbiAgICBpZiAoaXNDb2xncm91cCAmJiAhb3JpZ2luYWwgJiYgY29sZ3JvdXBzKSB7XG4gICAgICBjb2xncm91cHMuZm9yRWFjaCgoY29scywgckluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGdyb3VwSGVhZDogYW55ID0ge31cbiAgICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICBncm91cEhlYWRbY29sdW1uLmlkXSA9IG51bGxcbiAgICAgICAgfSlcbiAgICAgICAgY29scy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICBjb25zdCB7IF9jb2xTcGFuLCBfcm93U3BhbiB9ID0gY29sdW1uXG4gICAgICAgICAgY29uc3QgdmFsaWRDb2x1bW4gPSBnZXRWYWxpZENvbHVtbihjb2x1bW4pXG4gICAgICAgICAgY29uc3QgY29sdW1uSW5kZXggPSBjb2x1bW5zLmluZGV4T2YodmFsaWRDb2x1bW4pXG4gICAgICAgICAgZ3JvdXBIZWFkW3ZhbGlkQ29sdW1uLmlkXSA9IG9yaWdpbmFsID8gdmFsaWRDb2x1bW4ucHJvcGVydHkgOiBjb2x1bW4uZ2V0VGl0bGUoKVxuICAgICAgICAgIGlmIChfY29sU3BhbiA+IDEgfHwgX3Jvd1NwYW4gPiAxKSB7XG4gICAgICAgICAgICBzaGVldE1lcmdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgczogeyByOiBySW5kZXgsIGM6IGNvbHVtbkluZGV4IH0sXG4gICAgICAgICAgICAgIGU6IHsgcjogckluZGV4ICsgX3Jvd1NwYW4gLSAxLCBjOiBjb2x1bW5JbmRleCArIF9jb2xTcGFuIC0gMSB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgY29sTGlzdC5wdXNoKGdyb3VwSGVhZClcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbExpc3QucHVzaChjb2xIZWFkKVxuICAgIH1cbiAgICBiZWZvcmVSb3dDb3VudCArPSBjb2xMaXN0Lmxlbmd0aFxuICB9XG4gIC8vIOWkhOeQhuWQiOW5tlxuICBpZiAoaXNNZXJnZSAmJiAhb3JpZ2luYWwpIHtcbiAgICBtZXJnZUNlbGxzLmZvckVhY2gobWVyZ2VJdGVtID0+IHtcbiAgICAgIGNvbnN0IHsgcm93OiBtZXJnZVJvd0luZGV4LCByb3dzcGFuOiBtZXJnZVJvd3NwYW4sIGNvbDogbWVyZ2VDb2xJbmRleCwgY29sc3BhbjogbWVyZ2VDb2xzcGFuIH0gPSBtZXJnZUl0ZW1cbiAgICAgIHNoZWV0TWVyZ2VzLnB1c2goe1xuICAgICAgICBzOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCwgYzogbWVyZ2VDb2xJbmRleCB9LFxuICAgICAgICBlOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCArIG1lcmdlUm93c3BhbiAtIDEsIGM6IG1lcmdlQ29sSW5kZXggKyBtZXJnZUNvbHNwYW4gLSAxIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuICBjb25zdCByb3dMaXN0ID0gZGF0YXMubWFwKGl0ZW0gPT4ge1xuICAgIGNvbnN0IHJlc3Q6IGFueSA9IHt9XG4gICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgIHJlc3RbY29sdW1uLmlkXSA9IGdldENlbGxMYWJlbChjb2x1bW4sIGl0ZW1bY29sdW1uLmlkXSlcbiAgICB9KVxuICAgIHJldHVybiByZXN0XG4gIH0pXG4gIGJlZm9yZVJvd0NvdW50ICs9IHJvd0xpc3QubGVuZ3RoXG4gIC8vIOWkhOeQhuihqOWwvlxuICBpZiAoaXNGb290ZXIpIHtcbiAgICBjb25zdCB7IGZvb3RlckRhdGEgfSA9ICR0YWJsZS5nZXRUYWJsZURhdGEoKVxuICAgIGNvbnN0IGZvb3RlcnMgPSBnZXRGb290ZXJEYXRhKG9wdGlvbnMsIGZvb3RlckRhdGEpXG4gICAgY29uc3QgbWVyZ2VGb290ZXJJdGVtcyA9ICR0YWJsZS5nZXRNZXJnZUZvb3Rlckl0ZW1zKClcbiAgICAvLyDlpITnkIblkIjlubZcbiAgICBpZiAoaXNNZXJnZSAmJiAhb3JpZ2luYWwpIHtcbiAgICAgIG1lcmdlRm9vdGVySXRlbXMuZm9yRWFjaChtZXJnZUl0ZW0gPT4ge1xuICAgICAgICBjb25zdCB7IHJvdzogbWVyZ2VSb3dJbmRleCwgcm93c3BhbjogbWVyZ2VSb3dzcGFuLCBjb2w6IG1lcmdlQ29sSW5kZXgsIGNvbHNwYW46IG1lcmdlQ29sc3BhbiB9ID0gbWVyZ2VJdGVtXG4gICAgICAgIHNoZWV0TWVyZ2VzLnB1c2goe1xuICAgICAgICAgIHM6IHsgcjogbWVyZ2VSb3dJbmRleCArIGJlZm9yZVJvd0NvdW50LCBjOiBtZXJnZUNvbEluZGV4IH0sXG4gICAgICAgICAgZTogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQgKyBtZXJnZVJvd3NwYW4gLSAxLCBjOiBtZXJnZUNvbEluZGV4ICsgbWVyZ2VDb2xzcGFuIC0gMSB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cbiAgICBmb290ZXJzLmZvckVhY2goKHJvd3MpID0+IHtcbiAgICAgIGNvbnN0IGl0ZW06IGFueSA9IHt9XG4gICAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICBpdGVtW2NvbHVtbi5pZF0gPSBnZXRGb290ZXJDZWxsVmFsdWUoJHRhYmxlLCBvcHRpb25zLCByb3dzLCBjb2x1bW4pXG4gICAgICB9KVxuICAgICAgZm9vdExpc3QucHVzaChpdGVtKVxuICAgIH0pXG4gIH1cbiAgY29uc3QgZXhwb3J0TWV0aG9kID0gKCkgPT4ge1xuICAgIGNvbnN0IHdvcmtib29rID0gbmV3IEV4Y2VsSlMuV29ya2Jvb2soKVxuICAgIGNvbnN0IHNoZWV0ID0gd29ya2Jvb2suYWRkV29ya3NoZWV0KHNoZWV0TmFtZSlcbiAgICB3b3JrYm9vay5jcmVhdG9yID0gJ3Z4ZS10YWJsZSdcbiAgICBzaGVldC5jb2x1bW5zID0gc2hlZXRDb2xzXG4gICAgaWYgKGlzSGVhZGVyKSB7XG4gICAgICBzaGVldC5hZGRSb3dzKGNvbExpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xuICAgICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KVxuICAgICAgICB9XG4gICAgICAgIGV4Y2VsUm93LmVhY2hDZWxsKGV4Y2VsQ2VsbCA9PiB7XG4gICAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbClcbiAgICAgICAgICBjb25zdCBjb2x1bW46IGFueSA9ICR0YWJsZS5nZXRDb2x1bW5CeUlkKGV4Y2VsQ29sLmtleSBhcyBzdHJpbmcpXG4gICAgICAgICAgY29uc3QgeyBoZWFkZXJBbGlnbiwgYWxpZ24gfSA9IGNvbHVtblxuICAgICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgaGVhZGVyQWxpZ24gfHwgYWxpZ24gfHwgYWxsSGVhZGVyQWxpZ24gfHwgYWxsQWxpZ24pXG4gICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4Y2VsQ2VsbCwge1xuICAgICAgICAgICAgICBmb250OiB7XG4gICAgICAgICAgICAgICAgYm9sZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxGb250Q29sb3JcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZpbGw6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAncGF0dGVybicsXG4gICAgICAgICAgICAgICAgcGF0dGVybjogJ3NvbGlkJyxcbiAgICAgICAgICAgICAgICBmZ0NvbG9yOiB7XG4gICAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0SGVhZGVyQmFja2dyb3VuZENvbG9yXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBib3JkZXI6IGdldERlZmF1bHRCb3JkZXJTdHlsZSgpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHNoZWV0LmFkZFJvd3Mocm93TGlzdCkuZm9yRWFjaChleGNlbFJvdyA9PiB7XG4gICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgc2V0RXhjZWxSb3dIZWlnaHQoZXhjZWxSb3csIHJvd0hlaWdodClcbiAgICAgIH1cbiAgICAgIGV4Y2VsUm93LmVhY2hDZWxsKGV4Y2VsQ2VsbCA9PiB7XG4gICAgICAgIGNvbnN0IGV4Y2VsQ29sID0gc2hlZXQuZ2V0Q29sdW1uKGV4Y2VsQ2VsbC5jb2wpXG4gICAgICAgIGNvbnN0IGNvbHVtbjogYW55ID0gJHRhYmxlLmdldENvbHVtbkJ5SWQoZXhjZWxDb2wua2V5IGFzIHN0cmluZylcbiAgICAgICAgY29uc3QgeyBhbGlnbiB9ID0gY29sdW1uXG4gICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgYWxpZ24gfHwgYWxsQWxpZ24pXG4gICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XG4gICAgICAgICAgICBmb250OiB7XG4gICAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxGb250Q29sb3JcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvcmRlcjogZ2V0RGVmYXVsdEJvcmRlclN0eWxlKClcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gICAgaWYgKGlzRm9vdGVyKSB7XG4gICAgICBzaGVldC5hZGRSb3dzKGZvb3RMaXN0KS5mb3JFYWNoKGV4Y2VsUm93ID0+IHtcbiAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgc2V0RXhjZWxSb3dIZWlnaHQoZXhjZWxSb3csIHJvd0hlaWdodClcbiAgICAgICAgfVxuICAgICAgICBleGNlbFJvdy5lYWNoQ2VsbChleGNlbENlbGwgPT4ge1xuICAgICAgICAgIGNvbnN0IGV4Y2VsQ29sID0gc2hlZXQuZ2V0Q29sdW1uKGV4Y2VsQ2VsbC5jb2wpXG4gICAgICAgICAgY29uc3QgY29sdW1uOiBhbnkgPSAkdGFibGUuZ2V0Q29sdW1uQnlJZChleGNlbENvbC5rZXkgYXMgc3RyaW5nKVxuICAgICAgICAgIGNvbnN0IHsgZm9vdGVyQWxpZ24sIGFsaWduIH0gPSBjb2x1bW5cbiAgICAgICAgICBzZXRFeGNlbENlbGxTdHlsZShleGNlbENlbGwsIGZvb3RlckFsaWduIHx8IGFsaWduIHx8IGFsbEZvb3RlckFsaWduIHx8IGFsbEFsaWduKVxuICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihleGNlbENlbGwsIHtcbiAgICAgICAgICAgICAgZm9udDoge1xuICAgICAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEZvbnRDb2xvclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgYm9yZGVyOiBnZXREZWZhdWx0Qm9yZGVyU3R5bGUoKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cbiAgICBpZiAodXNlU3R5bGUgJiYgc2hlZXRNZXRob2QpIHtcbiAgICAgIHNoZWV0TWV0aG9kKHsgb3B0aW9uczogb3B0aW9ucywgd29ya2Jvb2ssIHdvcmtzaGVldDogc2hlZXQsIGNvbHVtbnMsIGNvbGdyb3VwcywgZGF0YXMsICR0YWJsZSB9KVxuICAgIH1cbiAgICBzaGVldE1lcmdlcy5mb3JFYWNoKCh7IHMsIGUgfSkgPT4ge1xuICAgICAgc2hlZXQubWVyZ2VDZWxscyhzLnIgKyAxLCBzLmMgKyAxLCBlLnIgKyAxLCBlLmMgKyAxKVxuICAgIH0pXG4gICAgd29ya2Jvb2sueGxzeC53cml0ZUJ1ZmZlcigpLnRoZW4oYnVmZmVyID0+IHtcbiAgICAgIHZhciBibG9iID0gbmV3IEJsb2IoW2J1ZmZlcl0sIHsgdHlwZTogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScgfSlcbiAgICAgIC8vIOWvvOWHuiB4bHN4XG4gICAgICBkb3dubG9hZEZpbGUocGFyYW1zLCBibG9iLCBvcHRpb25zKVxuICAgICAgaWYgKHNob3dNc2cpIHtcbiAgICAgICAgdnhldGFibGUubW9kYWwuY2xvc2UobXNnS2V5KVxuICAgICAgICB2eGV0YWJsZS5tb2RhbC5tZXNzYWdlKHsgbWVzc2FnZTogdnhldGFibGUudCgndnhlLnRhYmxlLmV4cFN1Y2Nlc3MnKSwgc3RhdHVzOiAnc3VjY2VzcycgfSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG4gIGlmIChzaG93TXNnKSB7XG4gICAgdnhldGFibGUubW9kYWwubWVzc2FnZSh7IGlkOiBtc2dLZXksIG1lc3NhZ2U6IHZ4ZXRhYmxlLnQoJ3Z4ZS50YWJsZS5leHBMb2FkaW5nJyksIHN0YXR1czogJ2xvYWRpbmcnLCBkdXJhdGlvbjogLTEgfSlcbiAgICBzZXRUaW1lb3V0KGV4cG9ydE1ldGhvZCwgMTUwMClcbiAgfSBlbHNlIHtcbiAgICBleHBvcnRNZXRob2QoKVxuICB9XG59XG5cbmZ1bmN0aW9uIGRvd25sb2FkRmlsZSAocGFyYW1zOiBWeGVHbG9iYWxJbnRlcmNlcHRvckhhbmRsZXMuSW50ZXJjZXB0b3JFeHBvcnRQYXJhbXMsIGJsb2I6IEJsb2IsIG9wdGlvbnM6IFZ4ZVRhYmxlUHJvcFR5cGVzLkV4cG9ydENvbmZpZykge1xuICBjb25zdCB7IG1lc3NhZ2UsIGZpbGVuYW1lLCB0eXBlIH0gPSBvcHRpb25zXG4gIGNvbnN0IHNob3dNc2cgPSBtZXNzYWdlICE9PSBmYWxzZVxuICBpZiAod2luZG93LkJsb2IpIHtcbiAgICBpZiAobmF2aWdhdG9yLm1zU2F2ZUJsb2IpIHtcbiAgICAgIG5hdmlnYXRvci5tc1NhdmVCbG9iKGJsb2IsIGAke2ZpbGVuYW1lfS4ke3R5cGV9YClcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbGlua0VsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcbiAgICAgIGxpbmtFbGVtLnRhcmdldCA9ICdfYmxhbmsnXG4gICAgICBsaW5rRWxlbS5kb3dubG9hZCA9IGAke2ZpbGVuYW1lfS4ke3R5cGV9YFxuICAgICAgbGlua0VsZW0uaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYilcbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobGlua0VsZW0pXG4gICAgICBsaW5rRWxlbS5jbGljaygpXG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGxpbmtFbGVtKVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoc2hvd01zZykge1xuICAgICAgdnhldGFibGUubW9kYWwuYWxlcnQoeyBtZXNzYWdlOiB2eGV0YWJsZS50KCd2eGUuZXJyb3Iubm90RXhwJyksIHN0YXR1czogJ2Vycm9yJyB9KVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja0ltcG9ydERhdGEgKHRhYmxlRmllbGRzOiBzdHJpbmdbXSwgZmllbGRzOiBzdHJpbmdbXSkge1xuICByZXR1cm4gZmllbGRzLnNvbWUoZmllbGQgPT4gdGFibGVGaWVsZHMuaW5kZXhPZihmaWVsZCkgPiAtMSlcbn1cblxuZnVuY3Rpb24gaW1wb3J0RXJyb3IgKHBhcmFtczogVnhlR2xvYmFsSW50ZXJjZXB0b3JIYW5kbGVzLkludGVyY2VwdG9ySW1wb3J0UGFyYW1zKSB7XG4gIGNvbnN0IHsgJHRhYmxlLCBvcHRpb25zIH0gPSBwYXJhbXNcbiAgY29uc3QgeyBpbnRlcm5hbERhdGEgfSA9ICR0YWJsZVxuICBjb25zdCB7IF9pbXBvcnRSZWplY3QgfSA9IGludGVybmFsRGF0YVxuICBjb25zdCBzaG93TXNnID0gb3B0aW9ucy5tZXNzYWdlICE9PSBmYWxzZVxuICBpZiAoc2hvd01zZykge1xuICAgIHZ4ZXRhYmxlLm1vZGFsLm1lc3NhZ2UoeyBtZXNzYWdlOiB2eGV0YWJsZS50KCd2eGUuZXJyb3IuaW1wRmllbGRzJyksIHN0YXR1czogJ2Vycm9yJyB9KVxuICB9XG4gIGlmIChfaW1wb3J0UmVqZWN0KSB7XG4gICAgX2ltcG9ydFJlamVjdCh7IHN0YXR1czogZmFsc2UgfSlcbiAgfVxufVxuXG5mdW5jdGlvbiBpbXBvcnRYTFNYIChwYXJhbXM6IFZ4ZUdsb2JhbEludGVyY2VwdG9ySGFuZGxlcy5JbnRlcmNlcHRvckltcG9ydFBhcmFtcykge1xuICBjb25zdCB7ICR0YWJsZSwgY29sdW1ucywgb3B0aW9ucywgZmlsZSB9ID0gcGFyYW1zXG4gIGNvbnN0IHsgaW50ZXJuYWxEYXRhIH0gPSAkdGFibGVcbiAgY29uc3QgeyBfaW1wb3J0UmVzb2x2ZSB9ID0gaW50ZXJuYWxEYXRhXG4gIGNvbnN0IHNob3dNc2cgPSBvcHRpb25zLm1lc3NhZ2UgIT09IGZhbHNlXG4gIGNvbnN0IGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gIGZpbGVSZWFkZXIub25lcnJvciA9ICgpID0+IHtcbiAgICBpbXBvcnRFcnJvcihwYXJhbXMpXG4gIH1cbiAgZmlsZVJlYWRlci5vbmxvYWQgPSAoZXZudCkgPT4ge1xuICAgIGNvbnN0IHRhYmxlRmllbGRzOiBzdHJpbmdbXSA9IFtdXG4gICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gY29sdW1uLnByb3BlcnR5XG4gICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgdGFibGVGaWVsZHMucHVzaChmaWVsZClcbiAgICAgIH1cbiAgICB9KVxuICAgIGNvbnN0IHdvcmtib29rID0gbmV3IEV4Y2VsSlMuV29ya2Jvb2soKVxuICAgIGNvbnN0IHJlYWRlclRhcmdldCA9IGV2bnQudGFyZ2V0XG4gICAgaWYgKHJlYWRlclRhcmdldCkge1xuICAgICAgd29ya2Jvb2sueGxzeC5sb2FkKHJlYWRlclRhcmdldC5yZXN1bHQgYXMgQXJyYXlCdWZmZXIpLnRoZW4od2IgPT4ge1xuICAgICAgICBjb25zdCBmaXJzdFNoZWV0ID0gd2Iud29ya3NoZWV0c1swXVxuICAgICAgICBpZiAoZmlyc3RTaGVldCkge1xuICAgICAgICAgIGNvbnN0IHNoZWV0VmFsdWVzID0gZmlyc3RTaGVldC5nZXRTaGVldFZhbHVlcygpIGFzIHN0cmluZ1tdW11cbiAgICAgICAgICBjb25zdCBmaWVsZEluZGV4ID0gWEVVdGlscy5maW5kSW5kZXhPZihzaGVldFZhbHVlcywgKGxpc3Q6IHN0cmluZ1tdKSA9PiBsaXN0ICYmIGxpc3QubGVuZ3RoID4gMClcbiAgICAgICAgICBjb25zdCBmaWVsZHMgPSBzaGVldFZhbHVlc1tmaWVsZEluZGV4XSBhcyBzdHJpbmdbXVxuICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IGNoZWNrSW1wb3J0RGF0YSh0YWJsZUZpZWxkcywgZmllbGRzKVxuICAgICAgICAgIGlmIChzdGF0dXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlY29yZHMgPSBzaGVldFZhbHVlcy5zbGljZShmaWVsZEluZGV4KS5tYXAobGlzdCA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGl0ZW0gOiBhbnkgPSB7fVxuICAgICAgICAgICAgICBsaXN0LmZvckVhY2goKGNlbGxWYWx1ZSwgY0luZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgaXRlbVtmaWVsZHNbY0luZGV4XV0gPSBjZWxsVmFsdWVcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgY29uc3QgcmVjb3JkOiBhbnkgPSB7fVxuICAgICAgICAgICAgICB0YWJsZUZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICAgICAgICByZWNvcmRbZmllbGRdID0gWEVVdGlscy5pc1VuZGVmaW5lZChpdGVtW2ZpZWxkXSkgPyBudWxsIDogaXRlbVtmaWVsZF1cbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgcmV0dXJuIHJlY29yZFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICR0YWJsZS5jcmVhdGVEYXRhKHJlY29yZHMpXG4gICAgICAgICAgICAgIC50aGVuKChkYXRhOiBhbnlbXSkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBsb2FkUmVzdDogUHJvbWlzZTxhbnk+XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubW9kZSA9PT0gJ2luc2VydCcpIHtcbiAgICAgICAgICAgICAgICAgIGxvYWRSZXN0ID0gJHRhYmxlLmluc2VydEF0KGRhdGEsIC0xKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBsb2FkUmVzdCA9ICR0YWJsZS5yZWxvYWREYXRhKGRhdGEpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBsb2FkUmVzdC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmIChfaW1wb3J0UmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICBfaW1wb3J0UmVzb2x2ZSh7IHN0YXR1czogdHJ1ZSB9KVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBpZiAoc2hvd01zZykge1xuICAgICAgICAgICAgICB2eGV0YWJsZS5tb2RhbC5tZXNzYWdlKHsgbWVzc2FnZTogdnhldGFibGUudCgndnhlLnRhYmxlLmltcFN1Y2Nlc3MnLCBbcmVjb3Jkcy5sZW5ndGhdKSwgc3RhdHVzOiAnc3VjY2VzcycgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW1wb3J0RXJyb3IocGFyYW1zKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbXBvcnRFcnJvcihwYXJhbXMpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGltcG9ydEVycm9yKHBhcmFtcylcbiAgICB9XG4gIH1cbiAgZmlsZVJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKVxufVxuXG5mdW5jdGlvbiBoYW5kbGVJbXBvcnRFdmVudCAocGFyYW1zOiBWeGVHbG9iYWxJbnRlcmNlcHRvckhhbmRsZXMuSW50ZXJjZXB0b3JJbXBvcnRQYXJhbXMpIHtcbiAgaWYgKHBhcmFtcy5vcHRpb25zLnR5cGUgPT09ICd4bHN4Jykge1xuICAgIGltcG9ydFhMU1gocGFyYW1zKVxuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUV4cG9ydEV2ZW50IChwYXJhbXM6IFZ4ZUdsb2JhbEludGVyY2VwdG9ySGFuZGxlcy5JbnRlcmNlcHRvckV4cG9ydFBhcmFtcykge1xuICBpZiAocGFyYW1zLm9wdGlvbnMudHlwZSA9PT0gJ3hsc3gnKSB7XG4gICAgZXhwb3J0WExTWChwYXJhbXMpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuLyoqXG4gKiDln7rkuo4gdnhlLXRhYmxlIOihqOagvOeahOWinuW8uuaPkuS7tu+8jOaUr+aMgeWvvOWHuiB4bHN4IOagvOW8j1xuICovXG5leHBvcnQgY29uc3QgVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYID0ge1xuICBpbnN0YWxsICh2eGV0YWJsZWNvcmU6IFZYRVRhYmxlQ29yZSkge1xuICAgIGNvbnN0IHsgc2V0dXAsIGludGVyY2VwdG9yIH0gPSB2eGV0YWJsZWNvcmVcblxuICAgIHZ4ZXRhYmxlID0gdnhldGFibGVjb3JlXG5cbiAgICBzZXR1cCh7XG4gICAgICBleHBvcnQ6IHtcbiAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICB4bHN4OiAwXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIGludGVyY2VwdG9yLm1peGluKHtcbiAgICAgICdldmVudC5pbXBvcnQnOiBoYW5kbGVJbXBvcnRFdmVudCxcbiAgICAgICdldmVudC5leHBvcnQnOiBoYW5kbGVFeHBvcnRFdmVudFxuICAgIH0pXG4gIH1cbn1cblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5WWEVUYWJsZSkge1xuICB3aW5kb3cuVlhFVGFibGUudXNlKFZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWClcbn1cblxuZXhwb3J0IGRlZmF1bHQgVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYXG4iLCJpbXBvcnQgWEVVdGlscyBmcm9tICd4ZS11dGlscyc7XG5pbXBvcnQgRXhjZWxKUyBmcm9tICdleGNlbGpzJztcbmxldCB2eGV0YWJsZTtcbmNvbnN0IGRlZmF1bHRIZWFkZXJCYWNrZ3JvdW5kQ29sb3IgPSAnZjhmOGY5JztcbmNvbnN0IGRlZmF1bHRDZWxsRm9udENvbG9yID0gJzYwNjI2Nic7XG5jb25zdCBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlID0gJ3RoaW4nO1xuY29uc3QgZGVmYXVsdENlbGxCb3JkZXJDb2xvciA9ICdlOGVhZWMnO1xuZnVuY3Rpb24gZ2V0Q2VsbExhYmVsKGNvbHVtbiwgY2VsbFZhbHVlKSB7XG4gICAgaWYgKGNlbGxWYWx1ZSkge1xuICAgICAgICBzd2l0Y2ggKGNvbHVtbi5jZWxsVHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gWEVVdGlscy50b1ZhbHVlU3RyaW5nKGNlbGxWYWx1ZSk7XG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgIGlmICghaXNOYU4oY2VsbFZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gTnVtYmVyKGNlbGxWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBpZiAoY2VsbFZhbHVlLmxlbmd0aCA8IDEyICYmICFpc05hTihjZWxsVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIoY2VsbFZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNlbGxWYWx1ZTtcbn1cbmZ1bmN0aW9uIGdldEZvb3RlckRhdGEob3B0cywgZm9vdGVyRGF0YSkge1xuICAgIGNvbnN0IHsgZm9vdGVyRmlsdGVyTWV0aG9kIH0gPSBvcHRzO1xuICAgIHJldHVybiBmb290ZXJGaWx0ZXJNZXRob2QgPyBmb290ZXJEYXRhLmZpbHRlcigoaXRlbXMsIGluZGV4KSA9PiBmb290ZXJGaWx0ZXJNZXRob2QoeyBpdGVtcywgJHJvd0luZGV4OiBpbmRleCB9KSkgOiBmb290ZXJEYXRhO1xufVxuZnVuY3Rpb24gZ2V0Rm9vdGVyQ2VsbFZhbHVlKCR0YWJsZSwgb3B0cywgcm93cywgY29sdW1uKSB7XG4gICAgY29uc3QgY2VsbFZhbHVlID0gZ2V0Q2VsbExhYmVsKGNvbHVtbiwgcm93c1skdGFibGUuZ2V0Vk1Db2x1bW5JbmRleChjb2x1bW4pXSk7XG4gICAgcmV0dXJuIGNlbGxWYWx1ZTtcbn1cbmZ1bmN0aW9uIGdldFZhbGlkQ29sdW1uKGNvbHVtbikge1xuICAgIGNvbnN0IHsgY2hpbGROb2RlcyB9ID0gY29sdW1uO1xuICAgIGNvbnN0IGlzQ29sR3JvdXAgPSBjaGlsZE5vZGVzICYmIGNoaWxkTm9kZXMubGVuZ3RoO1xuICAgIGlmIChpc0NvbEdyb3VwKSB7XG4gICAgICAgIHJldHVybiBnZXRWYWxpZENvbHVtbihjaGlsZE5vZGVzWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbHVtbjtcbn1cbmZ1bmN0aW9uIHNldEV4Y2VsUm93SGVpZ2h0KGV4Y2VsUm93LCBoZWlnaHQpIHtcbiAgICBpZiAoaGVpZ2h0KSB7XG4gICAgICAgIGV4Y2VsUm93LmhlaWdodCA9IFhFVXRpbHMuZmxvb3IoaGVpZ2h0ICogMC43NSwgMTIpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgYWxpZ24pIHtcbiAgICBleGNlbENlbGwucHJvdGVjdGlvbiA9IHtcbiAgICAgICAgbG9ja2VkOiBmYWxzZVxuICAgIH07XG4gICAgZXhjZWxDZWxsLmFsaWdubWVudCA9IHtcbiAgICAgICAgdmVydGljYWw6ICdtaWRkbGUnLFxuICAgICAgICBob3Jpem9udGFsOiBhbGlnbiB8fCAnbGVmdCdcbiAgICB9O1xufVxuZnVuY3Rpb24gZ2V0RGVmYXVsdEJvcmRlclN0eWxlKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHRvcDoge1xuICAgICAgICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXG4gICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbGVmdDoge1xuICAgICAgICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXG4gICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgYm90dG9tOiB7XG4gICAgICAgICAgICBzdHlsZTogZGVmYXVsdENlbGxCb3JkZXJTdHlsZSxcbiAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByaWdodDoge1xuICAgICAgICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXG4gICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5mdW5jdGlvbiBleHBvcnRYTFNYKHBhcmFtcykge1xuICAgIGNvbnN0IG1zZ0tleSA9ICd4bHN4JztcbiAgICBjb25zdCB7ICR0YWJsZSwgb3B0aW9ucywgY29sdW1ucywgY29sZ3JvdXBzLCBkYXRhcyB9ID0gcGFyYW1zO1xuICAgIGNvbnN0IHsgcHJvcHMsIHJlYWN0RGF0YSB9ID0gJHRhYmxlO1xuICAgIGNvbnN0IHsgaGVhZGVyQWxpZ246IGFsbEhlYWRlckFsaWduLCBhbGlnbjogYWxsQWxpZ24sIGZvb3RlckFsaWduOiBhbGxGb290ZXJBbGlnbiB9ID0gcHJvcHM7XG4gICAgY29uc3QgeyByb3dIZWlnaHQgfSA9IHJlYWN0RGF0YTtcbiAgICBjb25zdCB7IG1lc3NhZ2UsIHNoZWV0TmFtZSwgaXNIZWFkZXIsIGlzRm9vdGVyLCBpc01lcmdlLCBpc0NvbGdyb3VwLCBvcmlnaW5hbCwgdXNlU3R5bGUsIHNoZWV0TWV0aG9kIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IHNob3dNc2cgPSBtZXNzYWdlICE9PSBmYWxzZTtcbiAgICBjb25zdCBtZXJnZUNlbGxzID0gJHRhYmxlLmdldE1lcmdlQ2VsbHMoKTtcbiAgICBjb25zdCBjb2xMaXN0ID0gW107XG4gICAgY29uc3QgZm9vdExpc3QgPSBbXTtcbiAgICBjb25zdCBzaGVldENvbHMgPSBbXTtcbiAgICBjb25zdCBzaGVldE1lcmdlcyA9IFtdO1xuICAgIGxldCBiZWZvcmVSb3dDb3VudCA9IDA7XG4gICAgY29uc3QgY29sSGVhZCA9IHt9O1xuICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgaWQsIHByb3BlcnR5LCByZW5kZXJXaWR0aCB9ID0gY29sdW1uO1xuICAgICAgICBjb2xIZWFkW2lkXSA9IG9yaWdpbmFsID8gcHJvcGVydHkgOiBjb2x1bW4uZ2V0VGl0bGUoKTtcbiAgICAgICAgc2hlZXRDb2xzLnB1c2goe1xuICAgICAgICAgICAga2V5OiBpZCxcbiAgICAgICAgICAgIHdpZHRoOiBYRVV0aWxzLmNlaWwocmVuZGVyV2lkdGggLyA4LCAxKVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICAvLyDlpITnkIbooajlpLRcbiAgICBpZiAoaXNIZWFkZXIpIHtcbiAgICAgICAgLy8g5aSE55CG5YiG57uEXG4gICAgICAgIGlmIChpc0NvbGdyb3VwICYmICFvcmlnaW5hbCAmJiBjb2xncm91cHMpIHtcbiAgICAgICAgICAgIGNvbGdyb3Vwcy5mb3JFYWNoKChjb2xzLCBySW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBncm91cEhlYWQgPSB7fTtcbiAgICAgICAgICAgICAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBncm91cEhlYWRbY29sdW1uLmlkXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29scy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBfY29sU3BhbiwgX3Jvd1NwYW4gfSA9IGNvbHVtbjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsaWRDb2x1bW4gPSBnZXRWYWxpZENvbHVtbihjb2x1bW4pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2x1bW5JbmRleCA9IGNvbHVtbnMuaW5kZXhPZih2YWxpZENvbHVtbik7XG4gICAgICAgICAgICAgICAgICAgIGdyb3VwSGVhZFt2YWxpZENvbHVtbi5pZF0gPSBvcmlnaW5hbCA/IHZhbGlkQ29sdW1uLnByb3BlcnR5IDogY29sdW1uLmdldFRpdGxlKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfY29sU3BhbiA+IDEgfHwgX3Jvd1NwYW4gPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaGVldE1lcmdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzOiB7IHI6IHJJbmRleCwgYzogY29sdW1uSW5kZXggfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlOiB7IHI6IHJJbmRleCArIF9yb3dTcGFuIC0gMSwgYzogY29sdW1uSW5kZXggKyBfY29sU3BhbiAtIDEgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb2xMaXN0LnB1c2goZ3JvdXBIZWFkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29sTGlzdC5wdXNoKGNvbEhlYWQpO1xuICAgICAgICB9XG4gICAgICAgIGJlZm9yZVJvd0NvdW50ICs9IGNvbExpc3QubGVuZ3RoO1xuICAgIH1cbiAgICAvLyDlpITnkIblkIjlubZcbiAgICBpZiAoaXNNZXJnZSAmJiAhb3JpZ2luYWwpIHtcbiAgICAgICAgbWVyZ2VDZWxscy5mb3JFYWNoKG1lcmdlSXRlbSA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IHJvdzogbWVyZ2VSb3dJbmRleCwgcm93c3BhbjogbWVyZ2VSb3dzcGFuLCBjb2w6IG1lcmdlQ29sSW5kZXgsIGNvbHNwYW46IG1lcmdlQ29sc3BhbiB9ID0gbWVyZ2VJdGVtO1xuICAgICAgICAgICAgc2hlZXRNZXJnZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgczogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQsIGM6IG1lcmdlQ29sSW5kZXggfSxcbiAgICAgICAgICAgICAgICBlOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCArIG1lcmdlUm93c3BhbiAtIDEsIGM6IG1lcmdlQ29sSW5kZXggKyBtZXJnZUNvbHNwYW4gLSAxIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY29uc3Qgcm93TGlzdCA9IGRhdGFzLm1hcChpdGVtID0+IHtcbiAgICAgICAgY29uc3QgcmVzdCA9IHt9O1xuICAgICAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICAgICAgcmVzdFtjb2x1bW4uaWRdID0gZ2V0Q2VsbExhYmVsKGNvbHVtbiwgaXRlbVtjb2x1bW4uaWRdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN0O1xuICAgIH0pO1xuICAgIGJlZm9yZVJvd0NvdW50ICs9IHJvd0xpc3QubGVuZ3RoO1xuICAgIC8vIOWkhOeQhuihqOWwvlxuICAgIGlmIChpc0Zvb3Rlcikge1xuICAgICAgICBjb25zdCB7IGZvb3RlckRhdGEgfSA9ICR0YWJsZS5nZXRUYWJsZURhdGEoKTtcbiAgICAgICAgY29uc3QgZm9vdGVycyA9IGdldEZvb3RlckRhdGEob3B0aW9ucywgZm9vdGVyRGF0YSk7XG4gICAgICAgIGNvbnN0IG1lcmdlRm9vdGVySXRlbXMgPSAkdGFibGUuZ2V0TWVyZ2VGb290ZXJJdGVtcygpO1xuICAgICAgICAvLyDlpITnkIblkIjlubZcbiAgICAgICAgaWYgKGlzTWVyZ2UgJiYgIW9yaWdpbmFsKSB7XG4gICAgICAgICAgICBtZXJnZUZvb3Rlckl0ZW1zLmZvckVhY2gobWVyZ2VJdGVtID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHJvdzogbWVyZ2VSb3dJbmRleCwgcm93c3BhbjogbWVyZ2VSb3dzcGFuLCBjb2w6IG1lcmdlQ29sSW5kZXgsIGNvbHNwYW46IG1lcmdlQ29sc3BhbiB9ID0gbWVyZ2VJdGVtO1xuICAgICAgICAgICAgICAgIHNoZWV0TWVyZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBzOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCwgYzogbWVyZ2VDb2xJbmRleCB9LFxuICAgICAgICAgICAgICAgICAgICBlOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCArIG1lcmdlUm93c3BhbiAtIDEsIGM6IG1lcmdlQ29sSW5kZXggKyBtZXJnZUNvbHNwYW4gLSAxIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGZvb3RlcnMuZm9yRWFjaCgocm93cykgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IHt9O1xuICAgICAgICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICAgICAgICBpdGVtW2NvbHVtbi5pZF0gPSBnZXRGb290ZXJDZWxsVmFsdWUoJHRhYmxlLCBvcHRpb25zLCByb3dzLCBjb2x1bW4pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb290TGlzdC5wdXNoKGl0ZW0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY29uc3QgZXhwb3J0TWV0aG9kID0gKCkgPT4ge1xuICAgICAgICBjb25zdCB3b3JrYm9vayA9IG5ldyBFeGNlbEpTLldvcmtib29rKCk7XG4gICAgICAgIGNvbnN0IHNoZWV0ID0gd29ya2Jvb2suYWRkV29ya3NoZWV0KHNoZWV0TmFtZSk7XG4gICAgICAgIHdvcmtib29rLmNyZWF0b3IgPSAndnhlLXRhYmxlJztcbiAgICAgICAgc2hlZXQuY29sdW1ucyA9IHNoZWV0Q29scztcbiAgICAgICAgaWYgKGlzSGVhZGVyKSB7XG4gICAgICAgICAgICBzaGVldC5hZGRSb3dzKGNvbExpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXhjZWxSb3cuZWFjaENlbGwoZXhjZWxDZWxsID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbiA9ICR0YWJsZS5nZXRDb2x1bW5CeUlkKGV4Y2VsQ29sLmtleSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgaGVhZGVyQWxpZ24sIGFsaWduIH0gPSBjb2x1bW47XG4gICAgICAgICAgICAgICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgaGVhZGVyQWxpZ24gfHwgYWxpZ24gfHwgYWxsSGVhZGVyQWxpZ24gfHwgYWxsQWxpZ24pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib2xkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxGb250Q29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAncGF0dGVybicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdHRlcm46ICdzb2xpZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZnQ29sb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRIZWFkZXJCYWNrZ3JvdW5kQ29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBnZXREZWZhdWx0Qm9yZGVyU3R5bGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHNoZWV0LmFkZFJvd3Mocm93TGlzdCkuZm9yRWFjaChleGNlbFJvdyA9PiB7XG4gICAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4Y2VsUm93LmVhY2hDZWxsKGV4Y2VsQ2VsbCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbCk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sdW1uID0gJHRhYmxlLmdldENvbHVtbkJ5SWQoZXhjZWxDb2wua2V5KTtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGFsaWduIH0gPSBjb2x1bW47XG4gICAgICAgICAgICAgICAgc2V0RXhjZWxDZWxsU3R5bGUoZXhjZWxDZWxsLCBhbGlnbiB8fCBhbGxBbGlnbik7XG4gICAgICAgICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb250OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxGb250Q29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBnZXREZWZhdWx0Qm9yZGVyU3R5bGUoKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChpc0Zvb3Rlcikge1xuICAgICAgICAgICAgc2hlZXQuYWRkUm93cyhmb290TGlzdCkuZm9yRWFjaChleGNlbFJvdyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEV4Y2VsUm93SGVpZ2h0KGV4Y2VsUm93LCByb3dIZWlnaHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBleGNlbFJvdy5lYWNoQ2VsbChleGNlbENlbGwgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleGNlbENvbCA9IHNoZWV0LmdldENvbHVtbihleGNlbENlbGwuY29sKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29sdW1uID0gJHRhYmxlLmdldENvbHVtbkJ5SWQoZXhjZWxDb2wua2V5KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBmb290ZXJBbGlnbiwgYWxpZ24gfSA9IGNvbHVtbjtcbiAgICAgICAgICAgICAgICAgICAgc2V0RXhjZWxDZWxsU3R5bGUoZXhjZWxDZWxsLCBmb290ZXJBbGlnbiB8fCBhbGlnbiB8fCBhbGxGb290ZXJBbGlnbiB8fCBhbGxBbGlnbik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihleGNlbENlbGwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEZvbnRDb2xvclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6IGdldERlZmF1bHRCb3JkZXJTdHlsZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVzZVN0eWxlICYmIHNoZWV0TWV0aG9kKSB7XG4gICAgICAgICAgICBzaGVldE1ldGhvZCh7IG9wdGlvbnM6IG9wdGlvbnMsIHdvcmtib29rLCB3b3Jrc2hlZXQ6IHNoZWV0LCBjb2x1bW5zLCBjb2xncm91cHMsIGRhdGFzLCAkdGFibGUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc2hlZXRNZXJnZXMuZm9yRWFjaCgoeyBzLCBlIH0pID0+IHtcbiAgICAgICAgICAgIHNoZWV0Lm1lcmdlQ2VsbHMocy5yICsgMSwgcy5jICsgMSwgZS5yICsgMSwgZS5jICsgMSk7XG4gICAgICAgIH0pO1xuICAgICAgICB3b3JrYm9vay54bHN4LndyaXRlQnVmZmVyKCkudGhlbihidWZmZXIgPT4ge1xuICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbYnVmZmVyXSwgeyB0eXBlOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyB9KTtcbiAgICAgICAgICAgIC8vIOWvvOWHuiB4bHN4XG4gICAgICAgICAgICBkb3dubG9hZEZpbGUocGFyYW1zLCBibG9iLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmIChzaG93TXNnKSB7XG4gICAgICAgICAgICAgICAgdnhldGFibGUubW9kYWwuY2xvc2UobXNnS2V5KTtcbiAgICAgICAgICAgICAgICB2eGV0YWJsZS5tb2RhbC5tZXNzYWdlKHsgbWVzc2FnZTogdnhldGFibGUudCgndnhlLnRhYmxlLmV4cFN1Y2Nlc3MnKSwgc3RhdHVzOiAnc3VjY2VzcycgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgaWYgKHNob3dNc2cpIHtcbiAgICAgICAgdnhldGFibGUubW9kYWwubWVzc2FnZSh7IGlkOiBtc2dLZXksIG1lc3NhZ2U6IHZ4ZXRhYmxlLnQoJ3Z4ZS50YWJsZS5leHBMb2FkaW5nJyksIHN0YXR1czogJ2xvYWRpbmcnLCBkdXJhdGlvbjogLTEgfSk7XG4gICAgICAgIHNldFRpbWVvdXQoZXhwb3J0TWV0aG9kLCAxNTAwKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGV4cG9ydE1ldGhvZCgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRvd25sb2FkRmlsZShwYXJhbXMsIGJsb2IsIG9wdGlvbnMpIHtcbiAgICBjb25zdCB7IG1lc3NhZ2UsIGZpbGVuYW1lLCB0eXBlIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IHNob3dNc2cgPSBtZXNzYWdlICE9PSBmYWxzZTtcbiAgICBpZiAod2luZG93LkJsb2IpIHtcbiAgICAgICAgaWYgKG5hdmlnYXRvci5tc1NhdmVCbG9iKSB7XG4gICAgICAgICAgICBuYXZpZ2F0b3IubXNTYXZlQmxvYihibG9iLCBgJHtmaWxlbmFtZX0uJHt0eXBlfWApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgbGlua0VsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICBsaW5rRWxlbS50YXJnZXQgPSAnX2JsYW5rJztcbiAgICAgICAgICAgIGxpbmtFbGVtLmRvd25sb2FkID0gYCR7ZmlsZW5hbWV9LiR7dHlwZX1gO1xuICAgICAgICAgICAgbGlua0VsZW0uaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxpbmtFbGVtKTtcbiAgICAgICAgICAgIGxpbmtFbGVtLmNsaWNrKCk7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGxpbmtFbGVtKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHNob3dNc2cpIHtcbiAgICAgICAgICAgIHZ4ZXRhYmxlLm1vZGFsLmFsZXJ0KHsgbWVzc2FnZTogdnhldGFibGUudCgndnhlLmVycm9yLm5vdEV4cCcpLCBzdGF0dXM6ICdlcnJvcicgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBjaGVja0ltcG9ydERhdGEodGFibGVGaWVsZHMsIGZpZWxkcykge1xuICAgIHJldHVybiBmaWVsZHMuc29tZShmaWVsZCA9PiB0YWJsZUZpZWxkcy5pbmRleE9mKGZpZWxkKSA+IC0xKTtcbn1cbmZ1bmN0aW9uIGltcG9ydEVycm9yKHBhcmFtcykge1xuICAgIGNvbnN0IHsgJHRhYmxlLCBvcHRpb25zIH0gPSBwYXJhbXM7XG4gICAgY29uc3QgeyBpbnRlcm5hbERhdGEgfSA9ICR0YWJsZTtcbiAgICBjb25zdCB7IF9pbXBvcnRSZWplY3QgfSA9IGludGVybmFsRGF0YTtcbiAgICBjb25zdCBzaG93TXNnID0gb3B0aW9ucy5tZXNzYWdlICE9PSBmYWxzZTtcbiAgICBpZiAoc2hvd01zZykge1xuICAgICAgICB2eGV0YWJsZS5tb2RhbC5tZXNzYWdlKHsgbWVzc2FnZTogdnhldGFibGUudCgndnhlLmVycm9yLmltcEZpZWxkcycpLCBzdGF0dXM6ICdlcnJvcicgfSk7XG4gICAgfVxuICAgIGlmIChfaW1wb3J0UmVqZWN0KSB7XG4gICAgICAgIF9pbXBvcnRSZWplY3QoeyBzdGF0dXM6IGZhbHNlIH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGltcG9ydFhMU1gocGFyYW1zKSB7XG4gICAgY29uc3QgeyAkdGFibGUsIGNvbHVtbnMsIG9wdGlvbnMsIGZpbGUgfSA9IHBhcmFtcztcbiAgICBjb25zdCB7IGludGVybmFsRGF0YSB9ID0gJHRhYmxlO1xuICAgIGNvbnN0IHsgX2ltcG9ydFJlc29sdmUgfSA9IGludGVybmFsRGF0YTtcbiAgICBjb25zdCBzaG93TXNnID0gb3B0aW9ucy5tZXNzYWdlICE9PSBmYWxzZTtcbiAgICBjb25zdCBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmaWxlUmVhZGVyLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgIGltcG9ydEVycm9yKHBhcmFtcyk7XG4gICAgfTtcbiAgICBmaWxlUmVhZGVyLm9ubG9hZCA9IChldm50KSA9PiB7XG4gICAgICAgIGNvbnN0IHRhYmxlRmllbGRzID0gW107XG4gICAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZCA9IGNvbHVtbi5wcm9wZXJ0eTtcbiAgICAgICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgICAgIHRhYmxlRmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgd29ya2Jvb2sgPSBuZXcgRXhjZWxKUy5Xb3JrYm9vaygpO1xuICAgICAgICBjb25zdCByZWFkZXJUYXJnZXQgPSBldm50LnRhcmdldDtcbiAgICAgICAgaWYgKHJlYWRlclRhcmdldCkge1xuICAgICAgICAgICAgd29ya2Jvb2sueGxzeC5sb2FkKHJlYWRlclRhcmdldC5yZXN1bHQpLnRoZW4od2IgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0U2hlZXQgPSB3Yi53b3Jrc2hlZXRzWzBdO1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdFNoZWV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNoZWV0VmFsdWVzID0gZmlyc3RTaGVldC5nZXRTaGVldFZhbHVlcygpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZEluZGV4ID0gWEVVdGlscy5maW5kSW5kZXhPZihzaGVldFZhbHVlcywgKGxpc3QpID0+IGxpc3QgJiYgbGlzdC5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGRzID0gc2hlZXRWYWx1ZXNbZmllbGRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IGNoZWNrSW1wb3J0RGF0YSh0YWJsZUZpZWxkcywgZmllbGRzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVjb3JkcyA9IHNoZWV0VmFsdWVzLnNsaWNlKGZpZWxkSW5kZXgpLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdC5mb3JFYWNoKChjZWxsVmFsdWUsIGNJbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtW2ZpZWxkc1tjSW5kZXhdXSA9IGNlbGxWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWNvcmQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWJsZUZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjb3JkW2ZpZWxkXSA9IFhFVXRpbHMuaXNVbmRlZmluZWQoaXRlbVtmaWVsZF0pID8gbnVsbCA6IGl0ZW1bZmllbGRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICR0YWJsZS5jcmVhdGVEYXRhKHJlY29yZHMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbG9hZFJlc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubW9kZSA9PT0gJ2luc2VydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZFJlc3QgPSAkdGFibGUuaW5zZXJ0QXQoZGF0YSwgLTEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZFJlc3QgPSAkdGFibGUucmVsb2FkRGF0YShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRSZXN0LnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoX2ltcG9ydFJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9pbXBvcnRSZXNvbHZlKHsgc3RhdHVzOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaG93TXNnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdnhldGFibGUubW9kYWwubWVzc2FnZSh7IG1lc3NhZ2U6IHZ4ZXRhYmxlLnQoJ3Z4ZS50YWJsZS5pbXBTdWNjZXNzJywgW3JlY29yZHMubGVuZ3RoXSksIHN0YXR1czogJ3N1Y2Nlc3MnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0RXJyb3IocGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0RXJyb3IocGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGltcG9ydEVycm9yKHBhcmFtcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGZpbGVSZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSk7XG59XG5mdW5jdGlvbiBoYW5kbGVJbXBvcnRFdmVudChwYXJhbXMpIHtcbiAgICBpZiAocGFyYW1zLm9wdGlvbnMudHlwZSA9PT0gJ3hsc3gnKSB7XG4gICAgICAgIGltcG9ydFhMU1gocGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGhhbmRsZUV4cG9ydEV2ZW50KHBhcmFtcykge1xuICAgIGlmIChwYXJhbXMub3B0aW9ucy50eXBlID09PSAneGxzeCcpIHtcbiAgICAgICAgZXhwb3J0WExTWChwYXJhbXMpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuLyoqXG4gKiDln7rkuo4gdnhlLXRhYmxlIOihqOagvOeahOWinuW8uuaPkuS7tu+8jOaUr+aMgeWvvOWHuiB4bHN4IOagvOW8j1xuICovXG5leHBvcnQgY29uc3QgVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYID0ge1xuICAgIGluc3RhbGwodnhldGFibGVjb3JlKSB7XG4gICAgICAgIGNvbnN0IHsgc2V0dXAsIGludGVyY2VwdG9yIH0gPSB2eGV0YWJsZWNvcmU7XG4gICAgICAgIHZ4ZXRhYmxlID0gdnhldGFibGVjb3JlO1xuICAgICAgICBzZXR1cCh7XG4gICAgICAgICAgICBleHBvcnQ6IHtcbiAgICAgICAgICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgICAgICAgICB4bHN4OiAwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaW50ZXJjZXB0b3IubWl4aW4oe1xuICAgICAgICAgICAgJ2V2ZW50LmltcG9ydCc6IGhhbmRsZUltcG9ydEV2ZW50LFxuICAgICAgICAgICAgJ2V2ZW50LmV4cG9ydCc6IGhhbmRsZUV4cG9ydEV2ZW50XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LlZYRVRhYmxlKSB7XG4gICAgd2luZG93LlZYRVRhYmxlLnVzZShWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1gpO1xufVxuZXhwb3J0IGRlZmF1bHQgVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYO1xuIl19
