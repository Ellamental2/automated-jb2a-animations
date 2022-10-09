import { ObjectEntryStore }   from "@typhonjs-fvtt/svelte-standard/store";
import { writable }           from "svelte/store";
import { uuidv4 }             from "@typhonjs-fvtt/runtime/svelte/util";
import { isObject }           from '@typhonjs-fvtt/runtime/svelte/util';

import { custom_warning } from "../../../constants/constants.js";

import VideoPreview  from "../../Menus/Components/videoPreview/videoPreview.js"

//import { CategoryStore } from "../category/CategoryStore.js";
//import { aaSessionStorage } from "../../../../sessionStorage.js";
//import { constants } from "../../../../constants.js";

import {
   newTypeMenu,
   newNameMenu,
   newVariantMenu,
   newColorMenu,
   aaReturnWeapons
} from "../../../database/jb2a-menu-options.js";


export class AnimationStore extends ObjectEntryStore {
   /** @type {AnimationPropertyStores} */
   #stores;


   /**
    * @param {object}   data -
    */
   constructor(data = {}) {
      super(data);

      this.#stores = {
         videoIDX: writable(void 0),
      };
   }

   /**
    * @returns {AnimationPropertyStores}
    */
   get stores() { return this.#stores; }

   // ----------------------------------------------------------------------------------------------------------------

   /**
 * @param {object}   data -
 */
   set() {
      this._updateSubscribers();
   }

   async selectCustom(section, section02 = "video") {
      const current = this._data[section][section02].customPath;
      const picker = new FilePicker({
         type: "imagevideo",
         current,
         callback: (path) => {
            this._data[section][section02].customPath = path;
            this._updateSubscribers()
         },
      });
      setTimeout(() => {
         picker.element[0].style.zIndex = `${Number.MAX_SAFE_INTEGER}`;
      }, 100);
      await picker.browse(current);

   }

   loadPreviews() {
      VideoPreview.show();
   }

   getMenuDB(section, idx, isOnToken) {
      let menuDB = isOnToken ? "static" : this._data.menu === "ontoken" || this._data.menu === "aura" ? "static" : this._data.menu;
      menuDB = section === 'secondary' ? "static" : menuDB;
      return menuDB
   }

   menuTypeList(menuDB = "static") {
      return newTypeMenu[menuDB] || [];
   }
   animationList(section, idx, section02 = "video", menuDB = "static") {
      let menuType = this._data[section][section02].menuType;

      return newNameMenu[menuDB][menuType] || [];
   }
   variantList(section, idx, section02 = "video", menuDB = "static") {
      let menuType = this._data[section][section02].menuType;
      let animation = this._data[section][section02].animation;

      return newVariantMenu[menuDB][menuType]?.[animation] || [];
   }
   colorList(section, idx, section02 = "video", menuDB = "static") {
      let menuType = this._data[section][section02].menuType;
      let animation = this._data[section][section02].animation;
      let variant = this._data[section][section02].variant;

      return newColorMenu[menuDB][menuType]?.[animation]?.[variant] || [];
   }

   async databaseToClipboard(section, idx, section02, dbSection) {
      const dbPath = await this.getDBPath(section, idx, section02, dbSection);
      const app = new CopyClipBoard({
         target: document.getElementById("clipboard"),
         props: { dbPath },
      });
      app.$destroy();
   };

   async getDBPath(section, idx, section02 = "video", menuDB = "static") {
      let menuType = this._data[section][section02].menuType;
      let animation = this._data[section][section02].animation;
      let variant = this._data[section][section02].variant;
      let color = this._data[section][section02].color;
      return color === "random"
         ? `autoanimations.${menuDB}.${menuType}.${animation}.${variant}`
         : `autoanimations.${menuDB}.${menuType}.${animation}.${variant}.${color}`

   }
   menuTypeChange(section, idx, section02 = "video", menuDB = "static") {
      let menuType = this._data[section][section02].menuType;
      this._data[section][section02].animation = newNameMenu[menuDB][menuType][0][0];

      let animation = this._data[section][section02].animation;
      this._data[section][section02].variant = newVariantMenu[menuDB][menuType][animation][0][0];

      let variant = this._data[section][section02].variant;
      this._data[section][section02].color = newColorMenu[menuDB][menuType][animation][variant][0][0]
   }

   animationChange(section, idx, section02 = "video", menuDB = "static") {
      let menuType = this._data[section][section02].menuType;
      let animation = this._data[section][section02].animation;
      this._data[section][section02].variant = newVariantMenu[menuDB][menuType][animation][0][0];

      let variant = this._data[section][section02].variant;
      this._data[section][section02].color = newColorMenu[menuDB][menuType][animation][variant][0][0];
   }

   variantChange(section, idx, section02 = "video", menuDB = "static") {
      let menuType = this._data[section][section02].menuType;
      let animation = this._data[section][section02].animation;
      let variant = this._data[section][section02].variant;
      this._data[section][section02].color = newColorMenu[menuDB][menuType][animation][variant][0][0];
   }

   get typeMenu() { return newTypeMenu }
   get animationMenu() { return newNameMenu }
   get variantMenu() { return newVariantMenu }
   get colorMenu() { return newColorMenu }
   get returnWeapons() { return aaReturnWeapons }

   async openMacro(data) {
      if (!data) {
         ui.notifications.info(`Automated Animations: Cannot locate Macro ${data}`);
         return;
      }
      // Credit to Wasp, Zhell, Gazkhan and MrVauxs for the code in this section
      if (data.startsWith("Compendium")) {
         let packArray = data.split(".");
         let pack = game.packs.get(`${packArray[1]}.${packArray[2]}`);
         if (!pack) {
            ui.notifications.info(
               `Autoanimations | Compendium ${packArray[1]}.${packArray[2]} was not found`
            );
            return;
         }
         let macroFilter = pack.index.filter((m) => m.name === packArray[3]);
         if (!macroFilter.length) {
            ui.notifications.info(
               `Autoanimations | A macro named ${packArray[3]} was not found in Compendium ${packArray[1]}.${packArray[2]}`
            );
            return;
         }
         let macroDocument = await pack.getDocument(macroFilter[0]._id);
         macroDocument.sheet.render(true);
      } else {
         if (!data) {
            return;
         }
         let getTest = game.macros.getName(data);
         if (!getTest) {
            ui.notifications.info(
               `Autoanimations | Could not find the macro named ${data}`
            );
            return;
         }
         game.macros.getName(data).sheet.render(true);
      }
   }

   playSound(data) {
      const currentSection = data || {};
      const file = currentSection?.file;
      const volume = currentSection?.volume ?? .75;
      const startTime = currentSection?.startTime ?? 0;
      new Sequence()
         .sound()
         .file(file)
         .volume(volume)
         .startTime(startTime)
         .play();
   }

   async selectCustom(section, section02 = "video", idx) {
      const current = this._data[section][section02].customPath;
      const picker = new FilePicker({
         type: "imagevideo",
         current,
         callback: (path) => {
            this._data[section][section02].customPath = path;
            this._updateSubscribers()
         },
      });
      setTimeout(() => {
         picker.element[0].style.zIndex = `${Number.MAX_SAFE_INTEGER}`;
      }, 100);
      await picker.browse(current);

   }

   async selectSound(section, idx) {
      const current = this._data[section].sound.file;
      const picker = new FilePicker({
         type: "audio",
         current,
         callback: (path) => {
            this._data[section].sound.file = path;
            this._updateSubscribers()
         },
      });
      setTimeout(() => {
         picker.element[0].style.zIndex = `${Number.MAX_SAFE_INTEGER}`;
      }, 100);
      await picker.browse(current);
   }

   async selectSoundNested(section, section02, idx) {
      const current = this._data[section][section02].sound.file;
      const picker = new FilePicker({
         type: "audio",
         current,
         callback: (path) => {
            this._data[section][section02].sound.file = path;
            this._updateSubscribers()
         },
      });
      setTimeout(() => {
         picker.element[0].style.zIndex = `${Number.MAX_SAFE_INTEGER}`;
      }, 100);
      await picker.browse(current);
   }

   openSequencerViewer() {
      Sequencer.DatabaseViewer.show(true)
   }

   async copyFromAutorec(data) {
      if (!data) {
         ui.notifications.info("Automated Animations | There is no Global match found to copy!")
         return;
      }
      if (!isObject(data)) {
         ui.notifications.info("Automated Animations | Global Autorec data is not valid")
      }

      this._data.activeEffectType = data.activeEffectType;
      this._data.macro = data.macro;
      this._data.primary = data.primary;
      this._data.secondary = data.secondary;
      this._data.source = data.source;
      this._data.soundOnly = data.soundOnly;

      this._updateSubscribers()
   }
   async copyToAutorec(label) {
      //ui.notifications.info("Work In Progress")
      let menu = this._data.activeEffectType;
      if (menu === "default") {
         custom_warning("You are attempting to copy an Item to the Global menu, but you haven't configured the item!")
      }
      let data = structuredClone(this._data);
      data.id = uuidv4();
      data.label = label;

      delete data.isCustomized;
      delete data.isEnabled;

      let currentMenu = await game.settings.get('autoanimations', `aaAutorec-aefx`);
      currentMenu.push(data);
      await game.settings.set('autoanimations', `aaAutorec-aefx`, currentMenu)
   }
}

/**
 * @typedef {object} AnimationPropertyStores
 *
 * @property {import('svelte/store').Writable<boolean>} folderOpen - Session storage folder open store.
 *
 * @property {import('svelte/store').Writable<string>} label - Animation label.
 */
