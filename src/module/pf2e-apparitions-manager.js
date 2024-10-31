import { log } from './utils.js';
import { MODULENAME } from './const.js';
import { AnimistActor } from './AnimistActor.js';
import { ApparitionParser } from './Parser.js';
import { ApparitionManager } from './ApparitionManager.js';
import { apparitionDaily } from './daily/apparition.js';

let managerUi;

// Initialize module
Hooks.once('init', async () => {
  log('Initializing ' + MODULENAME);

  game.settings.register(MODULENAME, 'managerPosition', {
    name: 'manager position',
    scope: 'client',
    config: false,
    type: Object,
    default: {},
  });
});

Hooks.once('setup', async () => {
  game.modules.get(MODULENAME).api = {
    ApparitionParser,
    renderManager,
  };
});

Hooks.once('ready', async () => {
  game.modules.get('pf2e-dailies')?.api.registerCustomDailies(apparitionDaily);
});

Hooks.on('renderCharacterSheetPF2e', async function renderCharacterSheetHook(sheet, html) {
  const actor = new AnimistActor(sheet.actor);
  if (!actor.isAnimist()) return;

  //edit the character sheet
  actor.removeCastButton(html);
  actor.hideLores(html);
  actor.addManagerButton(html);

  //add event listener on the manager button
  html.on('click', '.open-manager', sheet, (event) => {
    event.stopPropagation();
    if (managerUi?.rendered && managerUi?.animistActor.actor.id === event.data.actor.id) {
      managerUi.close();
      return;
    }
    renderManager(event.data.actor);
  });
});

Hooks.on('preCreateChatMessage', async function (message) {
  //test if the manager is open for the actor
  if (!managerUi?.rendered) return;
  if (!(managerUi.animistActor.actor.id === message.actor.id)) return;

  //test if the actor is an animist
  const actor = new AnimistActor(message.actor);
  if (!actor.isAnimist()) return;

  //rerender if the daily concerns apparitions
  const regex = new RegExp(`<strong>Gained the temporary apparitions</strong>`);
  const match = message.content.match(regex);

  if (!match) return;

  renderManager(message.actor);
});

export async function renderManager(actor) {
  //test if there is already a manager UI stored
  if (managerUi) {
    //test if the correct manager is stored
    if (managerUi.animistActor.actor.id === actor.id) {
      managerUi.render({ force: true });
      return;
    }
    //close the old one if not
    await managerUi.close();
  }
  //render and store a new manager instance
  managerUi = new ApparitionManager(actor).render({ force: true, actor: actor });
}
