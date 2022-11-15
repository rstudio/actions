# `rstudio/actions/package-manager-publish-python`

This action may be used for building a Python package and publishing to Posit Package Manager.  

## Using this Action

You can import and use this GitHub Action in your project using 
```bash
curl -fOL --create-dirs --output-dir ./.github/workflows https://raw.githubusercontent.com/rstudio/actions/main/examples/package-manager-publish-python.yaml 
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

### `python-version`

The version of Python to use to build the package.  Accepts `3.x` for the latest stable release, or a specific version number.  Default: `3.x`

### `dir`

Relative path to package source directory.  Defaults to root of the repo.  

## Example usage

```yaml
steps:
  - uses: actions/checkout@v3
  - name: Build and Publish Python Package to Package Manager
    uses: rstudio/actions/package-manager-publish-python@main
    with:
      url: http://packagemanager.example.com:4242
      api-token: ${{ secrets.PPM_API_TOKEN }}
      python-version: 3.x
      source: local-python
```
