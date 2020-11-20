# `rstudio/actions/connect-publish`

This action may be use for publishing to RStudio Connect.

## Usage

The `url` or separate `api-key` argument is expected to contain an
[API key as genereted in RStudio
Connect](https://docs.rstudio.com/connect/__unreleased__/user/api-keys/).
Use of `actions/cache` with `rsconnect-python` dirs is recommended in
order to retain publishing information.

```yaml
steps:
  - uses: actions/checkout@v2

  - uses: r-lib/actions/setup-r@v1
    with:
      r-version: 3.6.3

  - uses: actions/setup-python@v2
    with:
      python-version: 3.x

  - name: Cache all rsconnect-python directories to track publishing information
    uses: actions/cache@v2
    with:
      path: |
        **/rsconnect-python

  - name: Setup RStudio Connect tools
    uses: rstudio/actions/setup-connect@main

  - name: Publish some things
    uses: rstudio/actions/connect-publish@main
    with:
      url: https://${{ secrets.RSTUDIO_CONNECT_API_KEY }}@connect.example.org
      dir: |
        ./very-shiny-app/
        ./useful-rmarkdown-report/
        ./slick-flask-api/
        ./insightful-jupyter-notebook/
```
