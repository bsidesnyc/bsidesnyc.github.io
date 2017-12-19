# Website for BSidesNYC

- template : https://github.com/gdg-x/zeppelin
- additional stock images are from Google Images, [unsplash](https://unsplash.com) & [pixabay](https://pixabay.com)

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

## Variables to update

Category | Path | Vars | Notes
--- | --- | --- | ---
site settings | `_config.yml` | `conYear` | "YYYY"
site settings | `_config.yml` | `previousSponsorCount` |
site settings | `_config.yml` | `previousAttendeeCount` |
event info | `_config.yml` | `eventTitle` |
event info | `_config.yml` | `eventDate` |
organizers | `/_data/organizers.yml` | | as needed
statistics | `_config.yml` | _attendees_, _CFP submissions_, _speakers_, _presentations_, _sponsors_, _parallel tracks_ |
cfp | `_config.yml` | `cfpOpenDate` |
cfp | `_config.yml` | `cfpCloseDate` |
cfp | `_config.yml` | `cfpAcceptanceDate` |
cfp | `/data/cfp_board.yml` | | as needed
dynamic speakers | `_config.yml` |  `dynamicSpeakersCount` | controls how many to display
dynamic speakers | `/layouts/default.html` | | controls column spacing for _modal_
rockstar supporters | `_config.yml` | `rockstarSupportersCount` | controls how many to display
rockstar supporters | `/layouts/default.html` | | controls column spacing for _modal_
sponsors | `/_data/sponsors.yml` | _name_, _website link_, _image location_ | divided into appropriate sponsor levels
sponsors | `_config.yml` | `sponsorshipKitUrl` | new sponsorship PDF under `/assets/`
tickets/registration | `_config.yml` | `ticketsOpen` |
tickets/registration | `_config.yml` | `_config.yml` > `ticketsOpenDate` |
tickets/registration | `_config.yml` | `_config.yml` > `ticketsButtons` | update _links_ for both `tickets_round_one` & `tickets_round_one`
ctf | `/_data/ctf_judges.yml` | | as needed
schedule | `/_data/schedule.yml` |  `date`, `dateReadable`, `tracks` > `titles`, `timeslots` > `sessionIds` | `sessionIds` map to `/_data/sessions.yml` > `id`
schedule | `/_data/sessions.yml` | |
schedule | `/_data/speakers.yml` | `id` | maps to `/_data/schedule.yml` > `sessionIds`

## Files to update

Category | Path  | Notes
--- | --- | ---
venue | `/img/venue/` | if new venue, or new rooms
organizers | `/img/organizers/` | as needed
cfp | `/img/cfp/` |
sponsors | `/assets/` |
sponsors | `/img/sponsors/` |
speakers | `/img/speakers/` |
supporters | `/img/supporters/` |
partners | `/img/partners/` |
ctf | `/img/ctf/` |
