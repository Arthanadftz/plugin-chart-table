import _pt from "prop-types";

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useCallback, useRef } from 'react';
import { useTable, usePagination, useSortBy, useGlobalFilter } from 'react-table';
import matchSorter from 'match-sorter';
import GlobalFilter from './components/GlobalFilter';
import SelectPageSize from './components/SelectPageSize';
import SimplePagination from './components/Pagination';
import useSticky from './hooks/useSticky';
// Be sure to pass our updateMyData and the skipReset option
export default function DataTable({
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
  const tableHooks = [useGlobalFilter, useSortBy, usePagination, doSticky ? useSticky : [], hooks || []].flat();
  const sortByRef = useRef([]); // cache initial `sortby` so sorting doesn't trigger page reset

  const pageSizeRef = useRef([initialPageSize, data.length]);
  const hasPagination = initialPageSize > 0 && data.length > 0; // pageSize == 0 means no pagination

  const hasGlobalControl = hasPagination || !!searchInput;
  const initialState = { ...initialState_,
    // zero length means all pages, the `usePagination` plugin does not
    // understand pageSize = 0
    sortBy: sortByRef.current,
    pageSize: initialPageSize > 0 ? initialPageSize : data.length || 10
  };
  const defaultWrapperRef = useRef(null);
  const globalControlRef = useRef(null);
  const paginationRef = useRef(null);
  const wrapperRef = userWrapperRef || defaultWrapperRef;
  const defaultGetTableSize = useCallback(() => {
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
  const defaultGlobalFilter = useCallback((rows, columnIds, filterValue) => {
    // allow searching by "col1 col2"
    const joinedString = row => {
      return columnIds.map(x => row.values[x]).join(' ');
    };

    return matchSorter(rows, filterValue, {
      keys: [...columnIds, joinedString],
      threshold: matchSorter.rankings.ACRONYM
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
  } = useTable({
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

  const renderTable = () => /*#__PURE__*/React.createElement("table", getTableProps({
    className: tableClassName
  }), /*#__PURE__*/React.createElement("thead", null, headerGroups.map(headerGroup => {
    const {
      key: headerGroupKey,
      ...headerGroupProps
    } = headerGroup.getHeaderGroupProps();
    return /*#__PURE__*/React.createElement("tr", _extends({
      key: headerGroupKey || headerGroup.id
    }, headerGroupProps), headerGroup.headers.map(column => {
      return column.render('Header', {
        key: column.id,
        ...column.getSortByToggleProps()
      });
    }));
  })), /*#__PURE__*/React.createElement("tbody", getTableBodyProps(), page && page.length > 0 ? page.map(row => {
    prepareRow(row);
    const {
      key: rowKey,
      ...rowProps
    } = row.getRowProps();
    return /*#__PURE__*/React.createElement("tr", _extends({
      key: rowKey || row.id
    }, rowProps), row.cells.map(cell => cell.render('Cell', {
      key: cell.column.id
    })));
  }) : /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    className: "dt-no-results",
    colSpan: columns.length
  }, typeof noResults === 'function' ? noResults(filterValue) : noResults)))); // force upate the pageSize when it's been update from the initial state


  if (pageSizeRef.current[0] !== initialPageSize || // when initialPageSize stays as zero, but total number of records changed,
  // we'd also need to update page size
  initialPageSize === 0 && pageSizeRef.current[1] !== data.length) {
    pageSizeRef.current = [initialPageSize, data.length];
    setPageSize(initialPageSize);
  }

  return /*#__PURE__*/React.createElement("div", {
    ref: wrapperRef,
    style: {
      width: initialWidth,
      height: initialHeight
    }
  }, hasGlobalControl ? /*#__PURE__*/React.createElement("div", {
    ref: globalControlRef,
    className: "form-inline dt-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-sm-6"
  }, hasPagination ? /*#__PURE__*/React.createElement(SelectPageSize, {
    total: data.length,
    current: pageSize,
    options: pageSizeOptions,
    selectRenderer: typeof selectPageSize === 'boolean' ? undefined : selectPageSize,
    onChange: setPageSize
  }) : null), searchInput ? /*#__PURE__*/React.createElement("div", {
    className: "col-sm-6"
  }, /*#__PURE__*/React.createElement(GlobalFilter, {
    searchInput: typeof searchInput === 'boolean' ? undefined : searchInput,
    preGlobalFilteredRows: preGlobalFilteredRows,
    setGlobalFilter: setGlobalFilter,
    filterValue: filterValue
  })) : null)) : null, wrapStickyTable ? wrapStickyTable(renderTable) : renderTable(), hasPagination ? /*#__PURE__*/React.createElement(SimplePagination, {
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
  tableClassName: _pt.string,
  pageSizeOptions: _pt.array,
  maxPageItemCount: _pt.number,
  hooks: _pt.array,
  width: _pt.oneOfType([_pt.string, _pt.number]),
  height: _pt.oneOfType([_pt.string, _pt.number]),
  pageSize: _pt.number,
  noResults: _pt.oneOfType([_pt.string, _pt.func]),
  sticky: _pt.bool
};