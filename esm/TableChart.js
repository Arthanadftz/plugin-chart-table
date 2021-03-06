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
import React, { useState, useMemo, useCallback } from 'react';
import { extent as d3Extent, max as d3Max } from 'd3-array';
import { FaSort, FaSortUp as FaSortAsc, FaSortDown as FaSortDesc } from 'react-icons/fa';
import { t, tn } from '@superset-ui/core';
import { DataType } from './types';
import DataTable from './DataTable';
import Styles from './Styles';
import formatValue from './utils/formatValue';
import { PAGE_SIZE_OPTIONS } from './controlPanel';

/**
 * Return sortType based on data type
 */
function getSortTypeByDataType(dataType) {
  if (dataType === DataType.DateTime) {
    return 'datetime';
  }

  if (dataType === DataType.String) {
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
  let sortIcon = /*#__PURE__*/React.createElement(FaSort, null);

  if (isSorted) {
    sortIcon = isSortedDesc ? /*#__PURE__*/React.createElement(FaSortDesc, null) : /*#__PURE__*/React.createElement(FaSortAsc, null);
  }

  return sortIcon;
}

function SearchInput({
  count,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "dt-global-filter"
  }, t('Search'), ' ', /*#__PURE__*/React.createElement("input", {
    className: "form-control input-sm",
    placeholder: tn('search.num_records', count),
    value: value,
    onChange: onChange
  }));
}

function SelectPageSize({
  options,
  current,
  onChange
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "dt-select-page-size form-inline"
  }, t('page_size.show'), ' ', /*#__PURE__*/React.createElement("select", {
    className: "form-control input-sm",
    value: current,
    onBlur: () => {},
    onChange: e => {
      onChange(Number(e.target.value));
    }
  }, options.map(option => {
    const [size, text] = Array.isArray(option) ? option : [option, option];
    return /*#__PURE__*/React.createElement("option", {
      key: size,
      value: size
    }, text);
  })), ' ', t('page_size.entries'));
}

export default function TableChart(props) {
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
  const [filters, setFilters] = useState(initialFilters); // only take relevant page size options

  const pageSizeOptions = useMemo(() => PAGE_SIZE_OPTIONS.filter(([n]) => n <= 2 * data.length), [data.length]);
  const getValueRange = useCallback(function getValueRange(key) {
    var _data$;

    if (typeof (data == null ? void 0 : (_data$ = data[0]) == null ? void 0 : _data$[key]) === 'number') {
      const nums = data.map(row => row[key]);
      return alignPositiveNegative ? [0, d3Max(nums.map(Math.abs))] : d3Extent(nums);
    }

    return null;
  }, [alignPositiveNegative, data]);
  const isActiveFilterValue = useCallback(function isActiveFilterValue(key, val) {
    var _filters$key;

    return !!filters && ((_filters$key = filters[key]) == null ? void 0 : _filters$key.includes(val));
  }, [filters]);
  const toggleFilter = useCallback(function toggleFilter(key, val) {
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
  const getColumnConfigs = useCallback((column, i) => {
    const {
      key,
      label,
      dataType
    } = column;
    let className = '';

    if (dataType === DataType.Number) {
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
        const [isHtml, text] = formatValue(column, value);
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
          return /*#__PURE__*/React.createElement("td", _extends({}, cellProps, {
            dangerouslySetInnerHTML: html
          }));
        } // If cellProps renderes textContent already, then we don't have to
        // render `Cell`. This saves some time for large tables.


        return /*#__PURE__*/React.createElement("td", cellProps, text);
      },
      Header: ({
        column: col,
        title,
        onClick,
        style
      }) => {
        return /*#__PURE__*/React.createElement("th", {
          title: title,
          className: col.isSorted ? `${className || ''} is-sorted` : className,
          style: style,
          onClick: onClick
        }, label, /*#__PURE__*/React.createElement(SortIcon, {
          column: col
        }));
      },
      sortDescFirst: sortDesc,
      sortType: getSortTypeByDataType(dataType)
    };
  }, [alignPositiveNegative, colorPositiveNegative, emitFilter, getValueRange, isActiveFilterValue, showCellBars, sortDesc, toggleFilter]);
  const columns = useMemo(() => {
    return columnsMeta.map(getColumnConfigs);
  }, [columnsMeta, getColumnConfigs]);
  return /*#__PURE__*/React.createElement(Styles, null, /*#__PURE__*/React.createElement(DataTable, {
    columns: columns,
    data: data,
    tableClassName: "table table-striped table-condensed",
    pageSize: pageSize,
    pageSizeOptions: pageSizeOptions,
    width: width,
    height: height // 9 page items in > 340px works well even for 100+ pages
    ,
    maxPageItemCount: width > 340 ? 9 : 7,
    noResults: filter => t(filter ? 'No matching records found' : 'No records found'),
    searchInput: includeSearch && SearchInput,
    selectPageSize: pageSize !== null && SelectPageSize // not in use in Superset, but needed for unit tests
    ,
    sticky: sticky
  }));
}