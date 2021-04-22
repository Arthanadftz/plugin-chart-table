"use strict";

exports.__esModule = true;
exports.default = DataTable;

var _propTypes = _interopRequireDefault(require("prop-types"));

var _react = _interopRequireWildcard(require("react"));

var _reactTable = require("react-table");

var _matchSorter = _interopRequireDefault(require("match-sorter"));

var _GlobalFilter = _interopRequireDefault(require("./components/GlobalFilter"));

var _SelectPageSize = _interopRequireDefault(require("./components/SelectPageSize"));

var _Pagination = _interopRequireDefault(require("./components/Pagination"));

var _useSticky = _interopRequireDefault(require("./hooks/useSticky"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

// Be sure to pass our updateMyData and the skipReset option
function DataTable({
  tableClassName,
  columns,
  data,
  width: initialWidth = '100%',
  height: initialHeight = 300,
  pageSize: initialPageSize = 0,
  initialState: initialState_ = {},
  pageSizeOptions = [10, 25, 50, 100, 200],
  maxPageItemCount = 9,
  sticky: doSticky,
  searchInput = true,
  selectPageSize,
  noResults = 'No data found',
  hooks,
  wrapperRef: userWrapperRef,
  ...moreUseTableOptions
}) {
  const tableHooks = [_reactTable.useGlobalFilter, _reactTable.useSortBy, _reactTable.usePagination, doSticky ? _useSticky.default : [], hooks || []].flat();
  const sortByRef = (0, _react.useRef)([]); // cache initial `sortby` so sorting doesn't trigger page reset

  const pageSizeRef = (0, _react.useRef)([initialPageSize, data.length]);
  const hasPagination = initialPageSize > 0 && data.length > 0; // pageSize == 0 means no pagination

  const hasGlobalControl = hasPagination || !!searchInput;
  const initialState = { ...initialState_,
    // zero length means all pages, the `usePagination` plugin does not
    // understand pageSize = 0
    sortBy: sortByRef.current,
    pageSize: initialPageSize > 0 ? initialPageSize : data.length || 10
  };
  const defaultWrapperRef = (0, _react.useRef)(null);
  const globalControlRef = (0, _react.useRef)(null);
  const paginationRef = (0, _react.useRef)(null);
  const wrapperRef = userWrapperRef || defaultWrapperRef;
  const defaultGetTableSize = (0, _react.useCallback)(() => {
    if (wrapperRef.current) {
      var _globalControlRef$cur, _paginationRef$curren;

      // `initialWidth` and `initialHeight` could be also parameters like `100%`
      // `Number` reaturns `NaN` on them, then we fallback to computed size
      const width = Number(initialWidth) || wrapperRef.current.clientWidth;
      const height = (Number(initialHeight) || wrapperRef.current.clientHeight) - (((_globalControlRef$cur = globalControlRef.current) == null ? void 0 : _globalControlRef$cur.clientHeight) || 0) - (((_paginationRef$curren = paginationRef.current) == null ? void 0 : _paginationRef$curren.clientHeight) || 0);
      return {
        width,
        height
      };
    }

    return undefined; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHeight, initialWidth, wrapperRef, hasPagination, hasGlobalControl]);
  const defaultGlobalFilter = (0, _react.useCallback)((rows, columnIds, filterValue) => {
    // allow searching by "col1 col2"
    const joinedString = row => {
      return columnIds.map(x => row.values[x]).join(' ');
    };

    return (0, _matchSorter.default)(rows, filterValue, {
      keys: [...columnIds, joinedString],
      threshold: _matchSorter.default.rankings.ACRONYM
    });
  }, []);
  const {
    getTableProps,
    getTableBodyProps,
    prepareRow,
    headerGroups,
    page,
    pageCount,
    gotoPage,
    preGlobalFilteredRows,
    setGlobalFilter,
    setPageSize: setPageSize_,
    wrapStickyTable,
    state: {
      pageIndex,
      pageSize,
      globalFilter: filterValue,
      sticky = {}
    }
  } = (0, _reactTable.useTable)({
    columns,
    data,
    initialState,
    getTableSize: defaultGetTableSize,
    globalFilter: defaultGlobalFilter,
    ...moreUseTableOptions
  }, ...tableHooks); // make setPageSize accept 0

  const setPageSize = size => {
    // keep the original size if data is empty
    if (size || data.length !== 0) {
      setPageSize_(size === 0 ? data.length : size);
    }
  };

  const renderTable = () => /*#__PURE__*/_react.default.createElement("table", getTableProps({
    className: tableClassName
  }), /*#__PURE__*/_react.default.createElement("thead", null, headerGroups.map(headerGroup => {
    const {
      key: headerGroupKey,
      ...headerGroupProps
    } = headerGroup.getHeaderGroupProps();
    return /*#__PURE__*/_react.default.createElement("tr", _extends({
      key: headerGroupKey || headerGroup.id
    }, headerGroupProps), headerGroup.headers.map(column => {
      return column.render('Header', {
        key: column.id,
        ...column.getSortByToggleProps()
      });
    }));
  })), /*#__PURE__*/_react.default.createElement("tbody", getTableBodyProps(), page && page.length > 0 ? page.map(row => {
    prepareRow(row);
    const {
      key: rowKey,
      ...rowProps
    } = row.getRowProps();
    return /*#__PURE__*/_react.default.createElement("tr", _extends({
      key: rowKey || row.id
    }, rowProps), row.cells.map(cell => cell.render('Cell', {
      key: cell.column.id
    })));
  }) : /*#__PURE__*/_react.default.createElement("tr", null, /*#__PURE__*/_react.default.createElement("td", {
    className: "dt-no-results",
    colSpan: columns.length
  }, typeof noResults === 'function' ? noResults(filterValue) : noResults)))); // force upate the pageSize when it's been update from the initial state


  if (pageSizeRef.current[0] !== initialPageSize || // when initialPageSize stays as zero, but total number of records changed,
  // we'd also need to update page size
  initialPageSize === 0 && pageSizeRef.current[1] !== data.length) {
    pageSizeRef.current = [initialPageSize, data.length];
    setPageSize(initialPageSize);
  }

  return /*#__PURE__*/_react.default.createElement("div", {
    ref: wrapperRef,
    style: {
      width: initialWidth,
      height: initialHeight
    }
  }, hasGlobalControl ? /*#__PURE__*/_react.default.createElement("div", {
    ref: globalControlRef,
    className: "form-inline dt-controls"
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "row"
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "col-sm-6"
  }, hasPagination ? /*#__PURE__*/_react.default.createElement(_SelectPageSize.default, {
    total: data.length,
    current: pageSize,
    options: pageSizeOptions,
    selectRenderer: typeof selectPageSize === 'boolean' ? undefined : selectPageSize,
    onChange: setPageSize
  }) : null), searchInput ? /*#__PURE__*/_react.default.createElement("div", {
    className: "col-sm-6"
  }, /*#__PURE__*/_react.default.createElement(_GlobalFilter.default, {
    searchInput: typeof searchInput === 'boolean' ? undefined : searchInput,
    preGlobalFilteredRows: preGlobalFilteredRows,
    setGlobalFilter: setGlobalFilter,
    filterValue: filterValue
  })) : null)) : null, wrapStickyTable ? wrapStickyTable(renderTable) : renderTable(), hasPagination ? /*#__PURE__*/_react.default.createElement(_Pagination.default, {
    ref: paginationRef,
    style: sticky.height ? undefined : {
      visibility: 'hidden'
    },
    maxPageItemCount: maxPageItemCount,
    pageCount: pageCount,
    currentPage: pageIndex,
    onPageChange: gotoPage
  }) : null);
}

DataTable.propTypes = {
  tableClassName: _propTypes.default.string,
  pageSizeOptions: _propTypes.default.array,
  maxPageItemCount: _propTypes.default.number,
  hooks: _propTypes.default.array,
  width: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number]),
  height: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number]),
  pageSize: _propTypes.default.number,
  noResults: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.func]),
  sticky: _propTypes.default.bool
};