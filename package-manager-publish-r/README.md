# `rstudio/actions/package-manager-publish-r`

This action may be used for building an R package and publishing to Posit Package Manager.  

## Using this Action

R users may find it easiest to set up scaffolding for GitHub Actions using the [`usethis`](https://usethis.r-lib.org/) package. 

You can import and use this GitHub Action in your project using 
```r
usethis::use_github_action(url = "https://raw.githubusercontent.com/rstudio/actions/main/examples/package-manager-publish-r.yaml", open = TRUE)
```

Once imported, you can adjust the settings below to match your use case.

## Inputs

### `url`

**Required** Posit Package Manager URL of the instance to which packages
will be published. 

### `api-token`

**Required** An API Token generated from the Package Manager CLI.  For security reasons, this value
should be set as a [GitHub Encrypted Secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets) and referenced 
as `api-token: ${{ secrets.SECRET_NAME }}` as in the example usage below.  

### `source`

**Required** Package Manager source to publish packages to.

### `r-version`

The version of R to use to build the package.  Accepts `release` for the latest release, or a specific version number.  Default: `'release'`

### `distro`

Package Manager distribution to publish binary package to, for example `centos7`, `jammy`, or `rhel8`.  
Distribution should correspond to the Docker distribution in the `runs-on` property of the GitHub Workflow 
(e.g. `runs-on: ubuntu-22.04` should use `distro: jammy`).  Complete list of
acceptable values can be found by running `rspm list distributions` on the Package Manager server.  
If input is not specified, only source package will be built.  

### `check`

Run R package checks, and don't publish if checks fail. Default: `true`

### `replace`

If source already contains a package with the same version, replace the existing one.  Default: `true`

### `dir`

Relative path to package source directory.  Defaults to root of the repo.  

## Example usage

```yaml
steps:
  - uses: actions/checkout@v3
  - name: Build and Publish R Package to Package Manager
    uses: rstudio/actions/package-manager-publish-r@main
    with:
      url: http://packagemanager.example.com:4242
      api-token: ${{ secrets.PPM_API_TOKEN }}
      r-version: release
      source: local
      distro: jammy
```
