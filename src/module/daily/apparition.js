import { MODULENAME } from '../const.js';

function hasFeat(actor, slug) {
  return actor.feats.contents[1].feats.find((e) => e.feat.slug == slug) != undefined;
}
function getEntriesSpontaneous(actor) {
  return actor.spellcasting.filter((entry) => entry.isSpontaneous);
}
function getEntriesFocus(actor) {
  return actor.spellcasting.filter((entry) => entry.isFocusPool);
}

export const apparitionDaily = [
  {
    key: 'apparition',
    label: 'Apparition',
    items: [
      {
        slug: 'attuned',
        uuid: 'Compendium.pf2e.classfeatures.Item.AHMjKkIx21AoMc9W',
        condition: (actor) => getEntriesSpontaneous(actor).length >= 1 && getEntriesFocus(actor).length >= 1,
      },
    ],
    rows: (actor) => {
      return [
        {
          type: 'select',
          slug: 'entryFocus',
          label: 'Spellcasting Vessel Entry',
          options: getEntriesFocus(actor).map((entry) => ({ label: entry.name, value: entry.id })),
          condition: getEntriesFocus(actor).length > 1,
        },
        {
          type: 'select',
          slug: 'entrySpontaneous',
          label: 'Spellcasting Apparition Entry',
          options: getEntriesSpontaneous(actor).map((entry) => ({ label: entry.name, value: entry.id })),
          condition: getEntriesSpontaneous(actor).length > 1,
        },
        {
          type: 'drop',
          slug: 'first',
          label: 'First Apparition',
          filter: {
            type: 'feat',
            search: { category: ['classfeature'], traits: ['animist'] },
          },
        },
        {
          type: 'drop',
          slug: 'second',
          label: 'Second Apparition',
          filter: {
            type: 'feat',
            search: { category: ['classfeature'], traits: ['animist'] },
          },
        },
        {
          type: 'drop',
          slug: 'third',
          label: 'Third Apparition',
          filter: {
            type: 'feat',
            search: { category: ['classfeature'], traits: ['animist'] },
          },
          condition: hasFeat(actor, 'third-apparition'),
        },
        {
          type: 'drop',
          slug: 'fourth',
          label: 'Fourth Apparition',
          filter: {
            type: 'feat',
            search: { category: ['classfeature'], traits: ['animist'] },
          },
          condition: hasFeat(actor, 'fourth-apparition'),
        },
      ];
    },
    process: async ({ rows, addFeat, addItem, messages, actor, items }) => {
      const entryApparitionId = rows.entrySpontaneous?.value ?? getEntriesSpontaneous(actor)[0].id;
      const entryVesselId = rows.entryFocus?.value ?? getEntriesFocus(actor)[0].id;
      const highestRank = actor.spellcasting.collections.get(entryApparitionId).highestRank;
      const arraySpellSource = [];

      actor.setFlag(MODULENAME, 'spellEntry', entryApparitionId);
      actor.setFlag(MODULENAME, 'spellFocusEntry', entryVesselId);
      messages.addGroup('apparitions', undefined, 'Apparitions attuned');
      for (const field in rows) {
        if (field == 'entryFocus' || field == 'entrySpontaneous') {
          continue;
        }
        const uuid = rows[field].uuid;
        const source = await game.modules.get('pf2e-dailies')?.api.utils.createFeatSource(uuid);
        const flagDisperse = {};
        const flagPrimary = {};
        flagDisperse[MODULENAME] = { dispersed: false };
        flagPrimary[MODULENAME] = { primary: field == 'first' ? true : false };
        source.flags = foundry.utils.mergeObject(flagDisperse, flagPrimary, { recursive: true });

        const lores = await game.modules.get(MODULENAME).api.ApparitionParser.lores(uuid);

        const flagLore = {};
        flagLore[MODULENAME] = { lores: lores };
        source.flags = foundry.utils.mergeObject(source.flags, flagLore, { recursive: true });

        addFeat(source, items.attuned);

        let loreProf;

        if (actor.level >= 16) {
          loreProf = 3;
        } else if (actor.level >= 8) {
          loreProf = 2;
        } else {
          loreProf = 1;
        }

        for (const i in lores) {
          const loreSource = game.modules
            .get('pf2e-dailies')
            ?.api.utils.createLoreSource({ name: lores[i], rank: loreProf });
          addItem(loreSource);
        }

        const spells = await game.modules.get(MODULENAME).api.ApparitionParser.spell(uuid, highestRank);

        for (const spell of spells) {
          const index = arraySpellSource.findIndex((e) => e.system.slug == spell.spell.system.slug);
          if (index >= 0) {
            arraySpellSource[index].flags[MODULENAME].source.push(source.system.slug);
            continue;
          }

          const spellSource = await game.modules
            .get('pf2e-dailies')
            ?.api.utils.createSpellSource(spell.spell.uuid, { identifier: entryApparitionId });

          spellSource.system.location.value = entryApparitionId;
          spellSource.system.traits.value.push('Apparition');
          if (!spellSource.system.traits.value.find((e) => e == 'cantrip')) {
            if (actor.flags[MODULENAME].signatureSpells.includes(spellSource._stats.compendiumSource))
              spellSource.system.location.signature = true;
            spellSource.system.location.heightenedLevel = spell.rank;
          }
          spellSource.flags[MODULENAME] = {
            source: [source.system.slug],
          };

          arraySpellSource.push(spellSource);
        }

        const vesselSpell = await game.modules.get(MODULENAME).api.ApparitionParser.vesselSpell(uuid);
        const vesselSpellSource = await game.modules
          .get('pf2e-dailies')
          ?.api.utils.createSpellSource(vesselSpell.uuid, { identifier: entryVesselId });
        vesselSpellSource.system.location.value = entryVesselId;
        vesselSpellSource.system.traits.value.push('Vessel');
        addItem(vesselSpellSource);

        messages.add('apparitions', { uuid, label: source.name });
      }

      for (const spellSOurce of arraySpellSource) {
        addItem(spellSOurce);
      }
    },
  },
];
