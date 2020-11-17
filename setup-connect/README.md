# `rstudio/actions/setup-connect`

This action may be use for setting up the environment to perform
actions with an RStudio Connect API, such as publishing an app.

## Usage

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: actions/setup-python@v2
    with:
      python-version: '3.x'
  - uses: r-lib/actions/setup-r@v1
    with:
      r-version: 3.6.3
  - uses: rstudio/actions/setup-connect@main
  # ...
```
