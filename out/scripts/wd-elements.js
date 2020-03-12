import 'setimmediate';
import WBK from 'wikibase-sdk';
import DataLoader from 'dataloader';

class WikibaseEntity {
  constructor(entity) {
    //   Original entitiy saved for future usage
    this.entity = entity;
    this.simplifyEntity = wbk.simplify.entity(entity);
  }

  getLabel(lang) {
    return Promise.resolve(this.simplifyEntity.labels[lang])
  }

  getDescription(lang) {
    return Promise.resolve(this.simplifyEntity.descriptions[lang])
  }

  getProperty(property, lang) {
    const propertyValue = this.simplifyEntity.claims[property];

    if (wbk.isItemId(propertyValue)) {
      return fetchEntity({id: propertyValue}).then(item => item.getLabel(lang))
    } else {
      return Promise.resolve(propertyValue)
    }
  }
}

// Inject setimmediate polyfill in order to use dataloader in browser

// TODO: Expose API to allow user to set custom endpoint
const wbk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql'
});

async function fetchEntitiesByIds({ids}) {
  const url = wbk.getEntities({ids});
  let response = await fetch(url);
  let res = await response.json();
  const {entities} = res;
  const entityInstances = Object();
  for (let [entityId, entity] of Object.entries(entities)) {
    entityInstances[entityId] = new WikibaseEntity(entity);
  }
  return entityInstances
}

async function batchGetEntities(keys) {
  const entities = await fetchEntitiesByIds({ids: keys});
  return keys.map(key => entities[key])
}

const entityLoader = new DataLoader(batchGetEntities);

async function fetchEntity({id}) {
  return await entityLoader.load(id)
}

class WDEntityElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const entityId = this.getAttribute('id');
    this.renderItem(entityId);
  }

  renderItem(entityId) {
    const property = this.getAttribute('property');
    const description = this.hasAttribute('description');
    const lang = this.getAttribute('lang');

    fetchEntity({id: entityId}).then(entity => {
      let q = null;

      if (description) {
        q = entity.getDescription(lang);
      } else if (property) {
        q = entity.getProperty(property, lang);
      } else {
        q = entity.getLabel(lang);
      }
      return q.then(value => {
        this.textContent = value;
      })
    });
  }

  disconnectedCallback() {}
}

if (!window.customElements.get('wd-entity')) {
  window.WDEntityElement = WDEntityElement;
  window.customElements.define('wd-entity', WDEntityElement);
}

export { WDEntityElement };
