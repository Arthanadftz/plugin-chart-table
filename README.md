## @arthanasti/plugin-chart-table

[![Version](https://img.shields.io/npm/v/@superset-ui/plugin-chart-table.svg?style=flat-square)](https://www.npmjs.com/package/@superset-ui/plugin-chart-table)
[![David (path)](https://img.shields.io/david/apache-superset/superset-ui-plugins.svg?path=packages%2Fsuperset-ui-plugin-chart-table&style=flat-square)](https://david-dm.org/apache-superset/superset-ui-plugins?path=plugins/superset-ui-plugin-chart-table)

This plugin provides Table chart for Superset.

### Usage

Configure `key`, which can be any `string`, and register the plugin. This `key` will be used to
lookup this chart throughout the app.

```js
import TableChartPlugin from '@arthanasti/plugin-chart-table';

new TableChartPlugin().configure({ key: 'table' }).register();
```

Then use it via `SuperChart`. See
[storybook](https://apache-superset.github.io/superset-ui-plugins/?selectedKind=plugin-chart-table)
for more details.

```js
<SuperChart
  chartType="table"
  width={600}
  height={600}
  formData={...}
  queryData={{
    data: {...},
  }}
/>
```
