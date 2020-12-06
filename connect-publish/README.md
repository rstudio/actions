# `rstudio/actions/connect-publish`

This action may be use for publishing to RStudio Connect.

## Usage

The `url` or separate `api-key` argument is expected to contain an
[API key as genereted in RStudio
Connect](https://docs.rstudio.com/connect/__unreleased__/user/api-keys/).

```yaml
steps:
  - uses: actions/checkout@v2

  - name: Publish some things
    uses: rstudio/actions/connect-publish@main
    with:
      url: https://${{ secrets.RSTUDIO_CONNECT_API_KEY }}@connect.example.org
      dir: |
        ./very-shiny-app/:/shiny/app/path/
        ./useful-rmarkdown-report/:/reports/useful/
        ./slick-flask-api/
        ./insightful-jupyter-notebook/:/notebooks/insights/
```
