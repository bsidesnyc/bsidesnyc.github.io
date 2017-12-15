# Website for BSidesNYC

- template : https://github.com/gdg-x/zeppelin

## Local Development

1. cd to repo's root dir
1. install required gems
  `sudo gem install github-pages jekyll-sitemap bundler rails compass sass-media_query_combiner autoprefixer-rails`
1. `bundle install`
1. `jekyll serve -w`
1. open web browser to http://127.0.0.1:4000 / http://localhost:4000

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

