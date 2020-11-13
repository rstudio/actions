# `rstudio/actions/setup-connect`

This action may be use for setting up the environment to perform
actions with an RStudio Connect API, such as publishing an app.

## Usage

This action should be used early in one's workflow steps, soon
after checkout. The argument `api-key` is expected to contain an
[API key as genereted in RStudio
Connect](https://docs.rstudio.com/connect/__unreleased__/user/api-keys/).

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: r-lib/actions/setup-r@v1
    with:
      r-version: '3.6.3'
  - uses: rstudio/actions/setup-connect@main
    with:
      api-key: ${{ secrets.RSTUDIO_CONNECT_API_KEY }}
      url: https://connect.example.org
```
