"use strict";

exports.__esModule = true;
exports.default = useSticky;
exports.ReducerActions = void 0;

var _react = _interopRequireWildcard(require("react"));

var _getScrollBarSize = _interopRequireDefault(require("../utils/getScrollBarSize"));

var _needScrollBar = _interopRequireDefault(require("../utils/needScrollBar"));

var _useMountedMemo = _interopRequireDefault(require("../utils/useMountedMemo"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
let ReducerActions;
exports.ReducerActions = ReducerActions;

(function (ReducerActions) {
  ReducerActions["init"] = "init";
  ReducerActions["setStickyState"] = "setStickyState";
})(ReducerActions || (exports.ReducerActions = ReducerActions = {}));

const sum = (a, b) => a + b;

const mergeStyleProp = (node, style) => ({
  style: { ...node.props.style,
    ...style
  }
});
/**
 * An HOC for generating sticky header and fixed-height scrollable area
 */


function StickyWrap({
  sticky = {},
  width: maxWidth,
  height: maxHeight,
  children: table,
  setStickyState
}) {
  if (!table || table.type !== 'table') {
    throw new Error('<StickyWrap> must have only one <table> element as child');
  }

  let thead;
  let tbody;
  let colgroup;

  _react.default.Children.forEach(table.props.children, node => {
    if (node.type === 'thead') {
      thead = node;
    } else if (node.type === 'tbody') {
      tbody = node;
    } else if (node.type === 'colgroup') {
      colgroup = node;
    }
  });

  if (!thead || !tbody) {
    throw new Error('<table> in <StickyWrap> must contain both thead and tbody.');
  }

  const columnCount = (0, _react.useMemo)(() => {
    var _thead;

    const headerRows = _react.default.Children.toArray((_thead = thead) == null ? void 0 : _thead.props.children).pop();

    return headerRows.props.children.length;
  }, [thead]);
  const theadRef = (0, _react.useRef)(null); // original thead for layout computation

  const scrollHeaderRef = (0, _react.useRef)(null); // fixed header

  const scrollBodyRef = (0, _react.useRef)(null); // main body

  const {
    bodyHeight,
    columnWidths
  } = sticky;
  const needSizer = !columnWidths || sticky.width !== maxWidth || sticky.height !== maxHeight || sticky.setStickyState !== setStickyState;
  const scrollBarSize = (0, _getScrollBarSize.default)(); // update scrollable area and header column sizes when mounted

  (0, _react.useLayoutEffect)(() => {
    if (theadRef.current) {
      const bodyThead = theadRef.current;
      const theadHeight = bodyThead.clientHeight;

      if (!theadHeight) {
        return;
      }

      const fullTableHeight = bodyThead.parentNode.clientHeight;
      const ths = bodyThead.childNodes[0].childNodes;
      const widths = Array.from(ths).map(th => th.clientWidth);
      const [hasVerticalScroll, hasHorizontalScroll] = (0, _needScrollBar.default)({
        width: maxWidth,
        height: maxHeight - theadHeight,
        innerHeight: fullTableHeight,
        innerWidth: widths.reduce(sum),
        scrollBarSize
      }); // real container height, include table header and space for
      // horizontal scroll bar

      const realHeight = Math.min(maxHeight, hasHorizontalScroll ? fullTableHeight + scrollBarSize : fullTableHeight);
      setStickyState({
        hasVerticalScroll,
        hasHorizontalScroll,
        setStickyState,
        width: maxWidth,
        height: maxHeight,
        realHeight,
        tableHeight: fullTableHeight,
        bodyHeight: realHeight - theadHeight,
        columnWidths: widths
      });
    }
  }, [maxWidth, maxHeight, setStickyState, scrollBarSize]);
  let sizerTable;
  let headerTable;
  let bodyTable;

  if (needSizer) {
    const theadWithRef = /*#__PURE__*/_react.default.cloneElement(thead, {
      ref: theadRef
    });

    sizerTable = /*#__PURE__*/_react.default.createElement("div", {
      key: "sizer",
      style: {
        height: maxHeight,
        overflow: 'auto',
        visibility: 'hidden'
      }
    }, /*#__PURE__*/_react.default.cloneElement(table, {}, colgroup, theadWithRef, tbody));
  } // reuse previously column widths, will be updated by `useLayoutEffect` above


  const colWidths = columnWidths == null ? void 0 : columnWidths.slice(0, columnCount);

  if (colWidths && bodyHeight) {
    const tableStyle = {
      tableLayout: 'fixed'
    };
    const bodyCols = colWidths.map((w, i) =>
    /*#__PURE__*/
    // eslint-disable-next-line react/no-array-index-key
    _react.default.createElement("col", {
      key: i,
      width: w
    }));

    const bodyColgroup = /*#__PURE__*/_react.default.createElement("colgroup", null, bodyCols); // header columns do not have vertical scroll bars,
    // so we add scroll bar size to the last column


    const headerColgroup = sticky.hasVerticalScroll && scrollBarSize ? /*#__PURE__*/_react.default.createElement("colgroup", null, colWidths.map((x, i) =>
    /*#__PURE__*/
    // eslint-disable-next-line react/no-array-index-key
    _react.default.createElement("col", {
      key: i,
      width: x + (i === colWidths.length - 1 ? scrollBarSize : 0)
    }))) : bodyColgroup;
    headerTable = /*#__PURE__*/_react.default.createElement("div", {
      key: "header",
      ref: scrollHeaderRef,
      style: {
        overflow: 'hidden'
      }
    }, /*#__PURE__*/_react.default.cloneElement(table, mergeStyleProp(table, tableStyle), headerColgroup, thead), headerTable);

    const onScroll = e => {
      if (scrollHeaderRef.current) {
        scrollHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft;
      }
    };

    bodyTable = /*#__PURE__*/_react.default.createElement("div", {
      key: "body",
      ref: scrollBodyRef,
      style: {
        height: bodyHeight,
        overflow: 'auto'
      },
      onScroll: sticky.hasHorizontalScroll ? onScroll : undefined
    }, /*#__PURE__*/_react.default.cloneElement(table, mergeStyleProp(table, tableStyle), bodyColgroup, tbody));
  }

  return /*#__PURE__*/_react.default.createElement("div", {
    style: {
      width: maxWidth,
      height: sticky.realHeight || maxHeight,
      overflow: 'hidden'
    }
  }, headerTable, bodyTable, sizerTable);
}

function useInstance(instance) {
  const {
    dispatch,
    state: {
      sticky
    },
    data,
    page,
    rows,
    getTableSize = () => undefined
  } = instance;
  const setStickyState = (0, _react.useCallback)(size => {
    dispatch({
      type: ReducerActions.setStickyState,
      size
    });
  }, // turning pages would also trigger a resize
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [dispatch, getTableSize, page, rows]);

  const useStickyWrap = renderer => {
    const {
      width,
      height
    } = (0, _useMountedMemo.default)(getTableSize, [getTableSize]) || sticky; // only change of data should trigger re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps

    const table = (0, _react.useMemo)(renderer, [page, rows]);
    (0, _react.useLayoutEffect)(() => {
      if (!width || !height) {
        setStickyState();
      }
    }, [width, height]);

    if (!width || !height) {
      return null;
    }

    if (data.length === 0) {
      return table;
    }

    return /*#__PURE__*/_react.default.createElement(StickyWrap, {
      width: width,
      height: height,
      sticky: sticky,
      setStickyState: setStickyState
    }, table);
  };

  Object.assign(instance, {
    setStickyState,
    wrapStickyTable: useStickyWrap
  });
}

function useSticky(hooks) {
  hooks.useInstance.push(useInstance);
  hooks.stateReducers.push((newState, action_) => {
    const action = action_;

    if (action.type === ReducerActions.init) {
      return { ...newState,
        sticky: newState.sticky || {}
      };
    }

    if (action.type === ReducerActions.setStickyState) {
      const {
        size
      } = action;

      if (!size) {
        return { ...newState
        };
      }

      return { ...newState,
        sticky: { ...newState.sticky,
          ...action.size
        }
      };
    }

    return newState;
  });
}

useSticky.pluginName = 'useSticky';