# Website for BSidesNYC

- template : https://github.com/gdg-x/zeppelin

## Local Development

1. clone the repo locally `git clone https://github.com/bsidesnyc/bsidesnyc.github.io.git`
1. `cd bsidesnyc.github.io`
1. install required gems
  `sudo gem install github-pages jekyll-sitemap bundler rails compass sass-media_query_combiner autoprefixer-rails`
1. `bundle install`
1. `jekyll serve -w`
1. open web browser to http://127.0.0.1:4000 / http://localhost:4000

_NOTE_:
- Changes made to `config.yml` requires jekyll to be restarted (`jekyll serve -w`) to be reflected locally
- REMEMBER to always **pull** for updates before working on updates to avoid conflicts.

# Making Changes

- most info is contained in `_config.yml` and YAML files in `_data`
- push changes to `master` branch

## dynamic speakers

Path | Notes
--- | ---
`_config.yml` | controls how many to display
`/layouts/default.html` | controls column spacing for _modal_

## rockstar supporters

Path | Notes
--- | ---
`_config.yml` | controls how many to display
`/layouts/default.html` | controls column spacing for _modal_

## sponsors

Path | Notes | Vars
--- | --- |  ---
`/data/sponsors.yml` | divided into appropriate sponsor levels |  `name`, `website link`, `image location`

