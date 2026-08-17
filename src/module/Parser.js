export class ApparitionParser {
  static async spell(uuid, highestRank) {
    const spells = [];

    //get the apparition feat
    const apparitionItem = await fromUuid(uuid);

    if (!apparitionItem) return;

    //extract the list of spells
    const regex = new RegExp(/Cantrips?.*/g);
    const match = apparitionItem.description.match(regex);
    if (!match) return;

    const strs = match[0].match(/(@UUID\[Compendium\.|@Compendium\[)(.*?)]({.*?})?/g);
    if (!strs) return;

    //get each spell item with it's rank
    let i = 0;
    for (const str of strs) {
      const spellUuid = str.split('[')[1].split(']')[0].replace('Compendium.', '');
      const spell = await fromUuid('Compendium.' + spellUuid);
      let groupId;
      if (!spell) continue;
      if (i > highestRank) break;
      if (i == 0) {
        groupId = 'cantrips';
      } else {
        groupId = i;
      }
      if (!groupId) return;
      spells.push({ spell: spell, rank: groupId });
      i++;
    }
    return spells;
  }

  static async vesselSpell(uuid) {
    //get the apparition feat
    const apparitionItem = await fromUuid(uuid);
    if (!apparitionItem) return;

    const regex = new RegExp(/Vessel Spell.*/g);
    const match = apparitionItem.description.match(regex);

    if (!match) return;
    //extract the vessel spell
    const strs = match[0].match(/(@UUID\[Compendium\.|@Compendium\[)(.*?)]({.*?})?/g);
    if (!strs) return;

    //get the vessel spell item
    const spellUuid = strs[0].split('[')[1].split(']')[0].replace('Compendium.', '');

    const spell = await fromUuid('Compendium.' + spellUuid);
    if (!spell) return;

    return spell;
  }

  static async lores(uuid) {
    //get the apparition feat
    const apparitionItem = await fromUuid(uuid);
    if (!apparitionItem) return;

    const skillsText = apparitionItem.description.match(new RegExp(/<strong>Apparition Skills<\/strong>.*$/gm));
    //extract lores
    const regex = new RegExp(/[a-zA-Z]*\sLore.*[a-zA-Z]*\sLore/g);
    const match = skillsText[0].match(regex);

    if (!match) return;

    const lores = match[0].split(',').map((item) => item.trim());

    return lores;
  }
}
