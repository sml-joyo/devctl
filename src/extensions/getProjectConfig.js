const cosmic = require('cosmiconfig');
const { resolve, dirname } = require('path');
const get = require('lodash/get');
const keyBy = require('lodash/keyBy');
const { print } = require('gluegun');
const { readYaml } = require('../utils/yaml');

module.exports = async toolbox => {
  // reads the config
  toolbox.getProjectConfig = async () => {
    const search = await cosmic('devctl', {
      searchPlaces: [
        '.devctl.json',
        '.devctl.yaml',
        '.devctl.yml',
        '.devctlrc.json',
        '.devctlrc.yaml',
        '.devctlrc.yml',
        'package.json',
      ],
    }).search();

    if (!search) {
      print.info(
        `${print.colors.error(`error`)} devctl configuration not found`
      );

      return {};
    }

    const cwd = dirname(search.filepath);
    const paths = {
      project: search.filepath,
      compose: resolve(cwd, '.devctl-docker-compose.yaml'),
      current: resolve(cwd, '.devctl-current.yaml'),
    };

    const project = search.config;
    project.cwd = cwd;
    project.paths = paths;
    project.services = keyBy(project.services, 'name');
    project.environment = keyBy(project.environment, 'name');

    project.current = await readYaml(paths.current);

    return project;
  };

  const projectConfig = await toolbox.getProjectConfig();

  toolbox.config = {
    ...projectConfig,
  };

  toolbox.get = (key, def) => get(projectConfig, key, def);
};
