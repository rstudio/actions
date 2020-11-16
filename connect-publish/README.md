# `rstudio/actions/connect-publish`

This action may be use for publishing to RStudio Connect.

## Usage

The `url` or separate `api-key` argument is expected to contain an
[API key as genereted in RStudio
Connect](https://docs.rstudio.com/connect/__unreleased__/user/api-keys/).

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: r-lib/actions/setup-r@v1
    with:
      r-version: '3.6.3'
  - uses: actions/setup-python@v2
    with:
      python-version: '3.x'
  - uses: rstudio/actions/setup-connect@main
  - uses: rstudio/actions/connect-publish@main
    with:
      url: https://${{ secrets.RSTUDIO_CONNECT_API_KEY }}@connect.example.org
      type: api
```
