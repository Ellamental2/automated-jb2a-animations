import { buildFile } from "../file-builder/build-filepath.js";
import { AAAnimationData } from "../../aa-classes/AAAnimationData.js";

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export async function dualattach(handler, animationData) {

    // Sets JB2A database and Global Delay
    let globalDelay = game.settings.get("autoanimations", "globaldelay");
    await wait(globalDelay);

    const data = animationData.primary;
    const sourceFX = animationData.sourceFX;

    const animFile = await buildFile(false, data.video.menuType, data.video.animation, "range", data.video.variant, data.video.color, data.video.customPath)

    const onlyX = data.video.customPath ? data.options.onlyX : false;

    const sourceToken = handler.sourceToken;
    let effectExists = Sequencer.EffectManager.getEffects({ object: sourceToken, origin: handler.itemUuid })

    async function cast() {

        let aaSeq = new Sequence();
        // Play Macro if Awaiting
        if (data.playMacro && data.macro.playWhen === "1") {
            let userData = data.macro.args;
            aaSeq.macro(data.macro.name, handler.workflow, handler, userData)
        }
        // Extra Effects => Source Token if active
        if (sourceFX.enabled) {
            aaSeq.addSequence(sourceFX.sourceSeq)
        }
        if (data.playSound) {
            aaSeq.addSequence(await AAAnimationData._sounds({ animationData }))
        }
        // Animation Start Hook
        aaSeq.thenDo(function () {
            Hooks.callAll("aa.animationStart", sourceToken, handler.allTargets)
        })
        for (let target of handler.allTargets) {
            let checkTarget = effectExists.filter(i => i.data.target.includes(target.id)).length > 0;
            if (!checkTarget) {
            aaSeq.effect()
                .file(animFile.file)
                .attachTo(sourceToken)
                .stretchTo(target, { attachTo: true, onlyX: onlyX })
                .persist(true)
                .playbackRate(data.options.playbackRate)
                .origin(handler.itemUuid)
                .elevation(data.options.elevation)
                //.playIf(!checkTarget)
            }
        }
        if (data.playMacro && data.macro.playWhen === "0") {
            let userData = data.macro.args;
            new Sequence()
                .macro(data.macro.name, handler.workflow, handler, userData)
                .play()
        }
        aaSeq.play()
        //Hooks.callAll("aa.animationEnd", sourceToken, handler.allTargets)
    }
    cast()
}
