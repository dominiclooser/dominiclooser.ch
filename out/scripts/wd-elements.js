import 'setimmediate';
import DataLoader from 'dataloader';
import WBK from 'wikibase-sdk';

// TODO: Expose API to allow user to set custom wikibase endpoint
const wbk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql',
});

// Inject setimmediate polyfill in order to use dataloader in browser

async function fetchEntitiesByIds({ids}) {
  const url = wbk.getEntities({ids});
  let response = await fetch(url);
  let res = await response.json();
  const {entities} = res;
  const entityInstances = Object();
  for (let [entityId, entity] of Object.entries(entities)) {
    entityInstances[entityId] = entity;
  }
  return entityInstances
}

async function batchGetEntities(keys) {
  const entities = await fetchEntitiesByIds({ids: keys});
  return keys.map((key) => entities[key])
}

const entityLoader = new DataLoader(batchGetEntities);

async function fetchEntity({id}) {
  return await entityLoader.load(id)
}

function parseArrayHTMLAttribute(value) {
  const listOfValues = value.split(',');
  return listOfValues.map((v) => v.trim())
}

class WikibaseEntity {
  constructor(entity) {
    // Original entitiy saved for future usage
    this.entity = entity;
    this.simplifyEntity = wbk.simplify.entity(entity);
  }

  static getEntity(args) {
    return fetchEntity(args).then((entity) => new WikibaseEntity(entity))
  }

  formatUrl(value) {
    const templates = this.simplifyEntity.claims.P1630;
    if (templates.length === 0) {
      throw new Error(
        `The property ${this.simplifyEntity.id} do not have a format url property (P1630)`
      )
    }
    const formatUrlTemplate = templates[0];
    // TODO: double check if that's possbile to more than 1 placeholder in the formatter?
    return formatUrlTemplate.replace('$1', value)
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
      if (!lang) {
        throw new Error(
          'You need to have provide a lang argument to display the property'
        )
      }

      return this.constructor
        .getEntity({id: propertyValue})
        .then((item) => item.getLabel(lang))
    } else {
      return Promise.resolve(propertyValue)
    }
  }

  getPropertyLink(property) {
    const propertyItemList = wbk.simplify.propertyClaims(
      this.entity.claims[property],
      {
        keepTypes: true,
      }
    );

    if (propertyItemList.length >= 0) {
      const propertyItem = propertyItemList[0];
      const {type, value} = propertyItem;

      if (type === 'url') {
        return Promise.resolve(value)
      } else if (type === 'external-id') {
        // TODO add options to fetch less data because we only to format the external id
        return this.constructor
          .getEntity({id: property})
          .then((item) => item.formatUrl(value))
      } else {
        throw new Error('This property is not a valid url or external id')
      }
    }

    // return Promise.resolve(propertyValue)
  }

  getSiteLink(sitenames) {
    const sitelinks = this.entity.sitelinks;

    for (var sitename of sitenames) {
      const sitelink = sitelinks[sitename];
      if (sitelink) {
        return Promise.resolve({
          ...sitelink,
          link: wbk.getSitelinkUrl(sitelink),
        })
      }
    }

    return Promise.reject()
  }
}

class WDEntityElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // TODO: deprecate the use of "id", since that's a built-in attribute in html
    const entityId = this.getAttribute('entity-id') || this.getAttribute('id');
    this.renderItem(entityId);
  }

  renderItem(entityId) {
    const property = this.getAttribute('property');
    const description = this.hasAttribute('description');
    const lang = this.getAttribute('lang');

    WikibaseEntity.getEntity({id: entityId}).then((entity) => {
      let q = null;

      if (description) {
        q = entity.getDescription(lang);
      } else if (property) {
        q = entity.getProperty(property, lang);
      } else {
        q = entity.getLabel(lang);
      }
      return q.then((value) => {
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

class WDLinkElement extends HTMLAnchorElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['entity-id', 'site', 'property']
  }

  connectedCallback() {
    const entityId = this.getAttribute('entity-id');
    this.renderElement(entityId);
  }

  attributeChangedCallback(_, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.renderElement(this.getAttribute('entity-id'));
    }
  }

  renderElement(entityId) {
    const property = this.getAttribute('property');
    const site = this.getAttribute('site');

    if (!(property || site)) {
      throw new Error("You need either 'property' or 'site' in the attributes")
    }

    WikibaseEntity.getEntity({id: entityId}).then((entity) => {
      if (property) {
        entity.getPropertyLink(property).then((value) => {
          this.setAttribute('href', value);
        });
      } else {
        entity.getSiteLink(parseArrayHTMLAttribute(site)).then(({link}) => {
          this.setAttribute('href', link);
        });
      }
    });
  }
}

if (!window.customElements.get('wd-link')) {
  window.WDLinkElement = WDLinkElement;
  window.customElements.define('wd-link', WDLinkElement, {extends: 'a'});
}

export { WDEntityElement, WDLinkElement };
