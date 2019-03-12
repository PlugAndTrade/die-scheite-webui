import * as R from 'ramda';

const getValues = (url, props) => {
  let qs = R.pipe(
    R.map(prop => `_aggs[]=${prop}`),
    R.join('&')
  )(props);

  return fetch(`${url}?${qs}&_size=0`)
    .then(r => r.json())
    .then(R.pipe(
      R.prop('aggregations'),
      R.map(R.juxt([R.prop('property'), R.prop('values')])),
      R.fromPairs
    ))
    ;
};

const search = (url, filters, size) => {
  let qs = R.pipe(
    R.toPairs,
    R.map(([prop, values]) => values ? R.map(value => `${prop}[]=${value}`, values) : []),
    R.unnest,
    R.join('&')
  )(filters);

  return fetch(`${url}?${qs}&_size=${size}`).then(r => r.json());
};

const getProperties = (url) => fetch(`${url}/properties`)
  .then(r => r.json())
  .then(R.prop('properties'));

export { getValues, search, getProperties };
