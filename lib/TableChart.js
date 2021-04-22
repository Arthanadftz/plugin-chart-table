"use strict";

exports.__esModule = true;
exports.default = TableChart;

var _react = _interopRequireWildcard(require("react"));

var _d3Array = require("d3-array");

var _fa = require("react-icons/fa");

var _core = require("@superset-ui/core");

var _types = require("./types");

var _DataTable = _interopRequireDefault(require("./DataTable"));

var _Styles = _interopRequireDefault(require("./Styles"));

var _formatValue = _interopRequireDefault(require("./utils/formatValue"));

var _controlPanel = require("./controlPanel");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

/**
 * Return sortType based on data type
 */
function getSortTypeByDataType(dataType) {
  if (dataType === _types.DataType.DateTime) {
    return 'datetime';
  }

  if (dataType === _types.DataType.String) {
    return 'alphanumeric';
  }

  return 'basic';
}
/**
 * Cell background to render columns as horizontal bar chart
 */


function cellBar({
  value,
  valueRange,
  colorPositiveNegative = false,
  alignPositiveNegative
}) {
  const [minValue, maxValue] = valueRange;
  const r = colorPositiveNegative && value < 0 ? 150 : 0;

  if (alignPositiveNegative) {
    const perc = Math.abs(Math.round(value / maxValue * 100)); // The 0.01 to 0.001 is a workaround for what appears to be a
    // CSS rendering bug on flat, transparent colors

    return `linear-gradient(to right, rgba(${r},0,0,0.2), rgba(${r},0,0,0.2) ${perc}%, ` + `rgba(0,0,0,0.01) ${perc}%, rgba(0,0,0,0.001) 100%)`;
  }

  const posExtent = Math.abs(Math.max(maxValue, 0));
  const negExtent = Math.abs(Math.min(minValue, 0));
  const tot = posExtent + negExtent;
  const perc1 = Math.round(Math.min(negExtent + value, negExtent) / tot * 100);
  const perc2 = Math.round(Math.abs(value) / tot * 100); // The 0.01 to 0.001 is a workaround for what appears to be a
  // CSS rendering bug on flat, transparent colors

  return `linear-gradient(to right, rgba(0,0,0,0.01), rgba(0,0,0,0.001) ${perc1}%, ` + `rgba(${r},0,0,0.2) ${perc1}%, rgba(${r},0,0,0.2) ${perc1 + perc2}%, ` + `rgba(0,0,0,0.01) ${perc1 + perc2}%, rgba(0,0,0,0.001) 100%)`;
}

function SortIcon({
  column
}) {
  const {
    isSorted,
    isSortedDesc
  } = column;

  let sortIcon = /*#__PURE__*/_react.default.createElement(_fa.FaSort, null);

  if (isSorted) {
    sortIcon = isSortedDesc ? /*#__PURE__*/_react.default.createElement(_fa.FaSortDown, null) : /*#__PURE__*/_react.default.createElement(_fa.FaSortUp, null);
  }

  return sortIcon;
}

function SearchInput({
  count,
  value,
  onChange
}) {
  return /*#__PURE__*/_react.default.createElement("span", {
    className: "dt-global-filter"
  }, (0, _core.t)('Search'), ' ', /*#__PURE__*/_react.default.createElement("input", {
    className: "form-control input-sm",
    placeholder: (0, _core.tn)('search.num_records', count),
    value: value,
    onChange: onChange
  }));
}

function SelectPageSize({
  options,
  current,
  onChange
}) {
  return /*#__PURE__*/_react.default.createElement("span", {
    className: "dt-select-page-size form-inline"
  }, (0, _core.t)('page_size.show'), ' ', /*#__PURE__*/_react.default.createElement("select", {
    className: "form-control input-sm",
    value: current,
    onBlur: () => {},
    onChange: e => {
      onChange(Number(e.target.value));
    }
  }, options.map(option => {
    const [size, text] = Array.isArray(option) ? option : [option, option];
    return /*#__PURE__*/_react.default.createElement("option", {
      key: size,
      value: size
    }, text);
  })), ' ', (0, _core.t)('page_size.entries'));
}

function TableChart(props) {
  const {
    height,
    width,
    data,
    columns: columnsMeta,
    alignPositiveNegative = false,
    colorPositiveNegative = false,
    includeSearch = false,
    pageSize = 0,
    showCellBars = true,
    emitFilter = false,
    sortDesc = false,
    onChangeFilter,
    filters: initialFilters,
    sticky = true // whether to use sticky header

  } = props;
  const [filters, setFilters] = (0, _react.useState)(initialFilters); // only take relevant page size options

  const pageSizeOptions = (0, _react.useMemo)(() => _controlPanel.PAGE_SIZE_OPTIONS.filter(([n]) => n <= 2 * data.length), [data.length]);
  const getValueRange = (0, _react.useCallback)(function getValueRange(key) {
    var _data$;

    if (typeof (data == null ? void 0 : (_data$ = data[0]) == null ? void 0 : _data$[key]) === 'number') {
      const nums = data.map(row => row[key]);
      return alignPositiveNegative ? [0, (0, _d3Array.max)(nums.map(Math.abs))] : (0, _d3Array.extent)(nums);
    }

    return null;
  }, [alignPositiveNegative, data]);
  const isActiveFilterValue = (0, _react.useCallback)(function isActiveFilterValue(key, val) {
    var _filters$key;

    return !!filters && ((_filters$key = filters[key]) == null ? void 0 : _filters$key.includes(val));
  }, [filters]);
  const toggleFilter = (0, _react.useCallback)(function toggleFilter(key, val) {
    const updatedFilters = { ...(filters || {})
    };

    if (filters && isActiveFilterValue(key, val)) {
      updatedFilters[key] = filters[key].filter(x => x !== val);
    } else {
      updatedFilters[key] = [...((filters == null ? void 0 : filters[key]) || []), val];
    }

    setFilters(updatedFilters);

    if (onChangeFilter) {
      onChangeFilter(updatedFilters);
    }
  }, [filters, isActiveFilterValue, onChangeFilter]);
  const getColumnConfigs = (0, _react.useCallback)((column, i) => {
    const {
      key,
      label,
      dataType
    } = column;
    let className = '';

    if (dataType === _types.DataType.Number) {
      className += ' dt-metric';
    } else if (emitFilter) {
      className += ' dt-is-filter';
    }

    const valueRange = showCellBars && getValueRange(key);
    return {
      id: String(i),
      // to allow duplicate column keys
      // must use custom accessor to allow `.` in column names
      // typing is incorrect in current version of `@types/react-table`
      // so we ask TS not to check.
      accessor: datum => datum[key],
      Cell: ({
        value
      }) => {
        const [isHtml, text] = (0, _formatValue.default)(column, value);
        const style = {
          background: valueRange ? cellBar({
            value: value,
            valueRange,
            alignPositiveNegative,
            colorPositiveNegative
          }) : undefined
        };
        const html = isHtml ? {
          __html: text
        } : undefined;
        const cellProps = {
          // show raw number in title in case of numeric values
          title: typeof value === 'number' ? String(value) : undefined,
          onClick: emitFilter && !valueRange ? () => toggleFilter(key, value) : undefined,
          className: `${className}${isActiveFilterValue(key, value) ? ' dt-is-active-filter' : ''}`,
          style
        };

        if (html) {
          // eslint-disable-next-line react/no-danger
          return /*#__PURE__*/_react.default.createElement("td", _extends({}, cellProps, {
            dangerouslySetInnerHTML: html
          }));
        } // If cellProps renderes textContent already, then we don't have to
        // render `Cell`. This saves some time for large tables.


        return /*#__PURE__*/_react.default.createElement("td", cellProps, text);
      },
      Header: ({
        column: col,
        title,
        onClick,
        style
      }) => {
        return /*#__PURE__*/_react.default.createElement("th", {
          title: title,
          className: col.isSorted ? `${className || ''} is-sorted` : className,
          style: style,
          onClick: onClick
        }, label, /*#__PURE__*/_react.default.createElement(SortIcon, {
          column: col
        }));
      },
      sortDescFirst: sortDesc,
      sortType: getSortTypeByDataType(dataType)
    };
  }, [alignPositiveNegative, colorPositiveNegative, emitFilter, getValueRange, isActiveFilterValue, showCellBars, sortDesc, toggleFilter]);
  const columns = (0, _react.useMemo)(() => {
    return columnsMeta.map(getColumnConfigs);
  }, [columnsMeta, getColumnConfigs]);
  return /*#__PURE__*/_react.default.createElement(_Styles.default, null, /*#__PURE__*/_react.default.createElement(_DataTable.default, {
    columns: columns,
    data: data,
    tableClassName: "table table-striped table-condensed",
    pageSize: pageSize,
    pageSizeOptions: pageSizeOptions,
    width: width,
    height: height // 9 page items in > 340px works well even for 100+ pages
    ,
    maxPageItemCount: width > 340 ? 9 : 7,
    noResults: filter => (0, _core.t)(filter ? 'No matching records found' : 'No records found'),
    searchInput: includeSearch && SearchInput,
    selectPageSize: pageSize !== null && SelectPageSize // not in use in Superset, but needed for unit tests
    ,
    sticky: sticky
  }));
}