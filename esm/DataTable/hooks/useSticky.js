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
import React, { useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import getScrollBarSize from '../utils/getScrollBarSize';
import needScrollBar from '../utils/needScrollBar';
import useMountedMemo from '../utils/useMountedMemo';
export let ReducerActions;

(function (ReducerActions) {
  ReducerActions["init"] = "init";
  ReducerActions["setStickyState"] = "setStickyState";
})(ReducerActions || (ReducerActions = {}));

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
  React.Children.forEach(table.props.children, node => {
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

  const columnCount = useMemo(() => {
    var _thead;

    const headerRows = React.Children.toArray((_thead = thead) == null ? void 0 : _thead.props.children).pop();
    return headerRows.props.children.length;
  }, [thead]);
  const theadRef = useRef(null); // original thead for layout computation

  const scrollHeaderRef = useRef(null); // fixed header

  const scrollBodyRef = useRef(null); // main body

  const {
    bodyHeight,
    columnWidths
  } = sticky;
  const needSizer = !columnWidths || sticky.width !== maxWidth || sticky.height !== maxHeight || sticky.setStickyState !== setStickyState;
  const scrollBarSize = getScrollBarSize(); // update scrollable area and header column sizes when mounted

  useLayoutEffect(() => {
    if (theadRef.current) {
      const bodyThead = theadRef.current;
      const theadHeight = bodyThead.clientHeight;

      if (!theadHeight) {
        return;
      }

      const fullTableHeight = bodyThead.parentNode.clientHeight;
      const ths = bodyThead.childNodes[0].childNodes;
      const widths = Array.from(ths).map(th => th.clientWidth);
      const [hasVerticalScroll, hasHorizontalScroll] = needScrollBar({
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
    const theadWithRef = /*#__PURE__*/React.cloneElement(thead, {
      ref: theadRef
    });
    sizerTable = /*#__PURE__*/React.createElement("div", {
      key: "sizer",
      style: {
        height: maxHeight,
        overflow: 'auto',
        visibility: 'hidden'
      }
    }, /*#__PURE__*/React.cloneElement(table, {}, colgroup, theadWithRef, tbody));
  } // reuse previously column widths, will be updated by `useLayoutEffect` above


  const colWidths = columnWidths == null ? void 0 : columnWidths.slice(0, columnCount);

  if (colWidths && bodyHeight) {
    const tableStyle = {
      tableLayout: 'fixed'
    };
    const bodyCols = colWidths.map((w, i) =>
    /*#__PURE__*/
    // eslint-disable-next-line react/no-array-index-key
    React.createElement("col", {
      key: i,
      width: w
    }));
    const bodyColgroup = /*#__PURE__*/React.createElement("colgroup", null, bodyCols); // header columns do not have vertical scroll bars,
    // so we add scroll bar size to the last column

    const headerColgroup = sticky.hasVerticalScroll && scrollBarSize ? /*#__PURE__*/React.createElement("colgroup", null, colWidths.map((x, i) =>
    /*#__PURE__*/
    // eslint-disable-next-line react/no-array-index-key
    React.createElement("col", {
      key: i,
      width: x + (i === colWidths.length - 1 ? scrollBarSize : 0)
    }))) : bodyColgroup;
    headerTable = /*#__PURE__*/React.createElement("div", {
      key: "header",
      ref: scrollHeaderRef,
      style: {
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.cloneElement(table, mergeStyleProp(table, tableStyle), headerColgroup, thead), headerTable);

    const onScroll = e => {
      if (scrollHeaderRef.current) {
        scrollHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft;
      }
    };

    bodyTable = /*#__PURE__*/React.createElement("div", {
      key: "body",
      ref: scrollBodyRef,
      style: {
        height: bodyHeight,
        overflow: 'auto'
      },
      onScroll: sticky.hasHorizontalScroll ? onScroll : undefined
    }, /*#__PURE__*/React.cloneElement(table, mergeStyleProp(table, tableStyle), bodyColgroup, tbody));
  }

  return /*#__PURE__*/React.createElement("div", {
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
  const setStickyState = useCallback(size => {
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
    } = useMountedMemo(getTableSize, [getTableSize]) || sticky; // only change of data should trigger re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps

    const table = useMemo(renderer, [page, rows]);
    useLayoutEffect(() => {
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

    return /*#__PURE__*/React.createElement(StickyWrap, {
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

export default function useSticky(hooks) {
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