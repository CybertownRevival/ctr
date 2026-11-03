<template>
  <div class="relative w-full h-full bg-black">
    <div ref="viewer" class="w-full h-full"></div>
    <div v-if="state !== 'ready'"
         class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div class="text-center p-4">
        <div v-if="state === 'loading'">Loading model&hellip;</div>
        <div v-else-if="state === 'failed'" class="text-red-500">
          The 3D viewer could not load this object.
          <div class="text-xs mt-1">{{ failureReason }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

/**
 * The Mall object preview, rendered with the X_ITE build the app already loads.
 *
 * Two things here are deliberate, and were established by testing rather than
 * assumed:
 *
 * 1. The browser is addressed with `X3D.getBrowser(element)`. The element never
 *    exposes a `browser` property, and the no-argument form returns whichever
 *    browser X_ITE feels like - which, on any page where the world browser is
 *    already mounted, is not this canvas.
 *
 * 2. Exactly one browser is created for the component's lifetime. Stepping
 *    through the pending queue swaps the object's url on the existing Inline
 *    rather than tearing the browser down and building another; repeated
 *    create/dispose cycles leave later browsers unable to load a world at all.
 *
 * Completion is reported by X_ITE's own LoadSensor rather than by a fixed delay.
 * The previous checker waited a blind 3000ms twice and showed an empty black
 * screen whenever the model took longer.
 */

declare const X3D: any;

/** Empty world that starts the browser. Loading it is what boots the render loop. */
const PREVIEW_WORLD = "/assets/object/ObjectPreview.wrl";

/** The Mall size and position reference grid staff judge the object against. */
const REFERENCE_GRID = "/assets/object/MallReference.wrl";

const LOAD_TIMEOUT_SECONDS = 20;
const BACKSTOP_MS = 25000;

/**
 * Readiness poll for the base world. X_ITE's INITIALIZED_EVENT does not fire for
 * a browser created through `createBrowser`, so readiness is observed directly.
 */
const READY_POLL_MS = 100;
const READY_TIMEOUT_MS = 15000;

interface ViewerInternals {
  browser: any;
  element: HTMLElement | null;
  /** The Inline whose url is swapped as the checker moves between objects. */
  objectInline: any;
  /**
   * The LoadSensor watching `objectInline`, and the key its callback is
   * registered under. Held so the previous one can be released before the next
   * is installed -- a checker session walks through many objects, and without
   * this every one of them leaves a sensor in the scene graph watching the same
   * Inline, plus a retained callback closing over this component.
   */
  objectSensor: any;
  objectSensorKey: string | null;
  backstop: number | null;
  /**
   * Incremented on every load. Callbacks already in flight for a previous object
   * would otherwise resolve against the current one and report a failure for a
   * model that loaded perfectly well.
   */
  generation: number;
}

/**
 * X_ITE handles are held outside `data()` on purpose. Anything returned from
 * `data()` is made deeply reactive, and Vue walking the live X_ITE browser and
 * its scene graph would be both expensive and unsafe.
 */
const internals = new WeakMap<Vue, ViewerInternals>();

function internalsFor(component: Vue): ViewerInternals {
  let existing = internals.get(component);
  if (!existing) {
    existing = {
      browser: null,
      element: null,
      objectInline: null,
      objectSensor: null,
      objectSensorKey: null,
      backstop: null,
      generation: 0,
    };
    internals.set(component, existing);
  }
  return existing;
}

let callbackSequence = 0;

export default Vue.extend({
  name: "MallObjectViewer",
  props: {
    objectUrl: {
      type: String,
      required: true,
    },
    showReference: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      state: "loading",
      failureReason: "",
      callbackKey: `mall-checker-${(callbackSequence += 1)}`,
    };
  },
  watch: {
    objectUrl(url: string) {
      this.showObject(url);
    },
  },
  mounted() {
    this.start();
  },
  beforeDestroy() {
    this.teardown();
  },
  methods: {
    start() {
      const own = internalsFor(this);
      const generation = (own.generation += 1);

      if (typeof X3D === "undefined") {
        this.fail(generation, "The X_ITE viewer library is not available.");
        return;
      }

      try {
        const element = X3D.createBrowser();
        own.element = element;
        (this.$refs.viewer as HTMLElement).appendChild(element);

        const browser = X3D.getBrowser(element);
        own.browser = browser;

        // Loading the blank world is what actually starts this browser: without
        // it the scene accepts nodes but nothing is ever rendered.
        browser.loadURL(new X3D.MFString(PREVIEW_WORLD));
        this.armBackstop(generation);
        this.whenWorldReady(generation, browser, () => this.buildScene(generation, browser));
      } catch (error) {
        this.fail(generation, String((error as Error).message || error));
      }
    },

    /** True while `generation` is still the load currently being displayed. */
    isCurrent(generation: number): boolean {
      return internalsFor(this).generation === generation;
    },

    armBackstop(generation: number) {
      const own = internalsFor(this);
      this.clearBackstop();
      own.backstop = window.setTimeout(
        () => this.fail(generation, "The viewer did not report that it finished loading."),
        BACKSTOP_MS,
      );
    },

    /** Waits for the base world before adding anything to the scene. */
    whenWorldReady(generation: number, browser: any, ready: () => void) {
      const deadline = Date.now() + READY_TIMEOUT_MS;
      const poll = () => {
        if (!this.isCurrent(generation)) {
          return;
        }
        const scene = browser.currentScene;
        if (scene && scene.rootNodes && scene.rootNodes.length > 0) {
          ready();
          return;
        }
        if (Date.now() > deadline) {
          this.fail(generation, "The viewer did not finish starting up.");
          return;
        }
        window.setTimeout(poll, READY_POLL_MS);
      };
      poll();
    },

    /** Adds the reference grid and the object Inline once, on first load. */
    buildScene(generation: number, browser: any) {
      try {
        const own = internalsFor(this);
        const scene = browser.currentScene;

        if (this.showReference) {
          const reference = scene.createNode("Inline");
          reference.url = new X3D.MFString(REFERENCE_GRID);
          scene.addRootNode(reference);
        }

        const object = scene.createNode("Inline");
        object.url = new X3D.MFString(this.objectUrl);
        own.objectInline = object;
        scene.addRootNode(object);

        this.watchObject(generation, scene, object);
      } catch (error) {
        this.fail(generation, String((error as Error).message || error));
      }
    },

    /**
     * Points the existing Inline at a different object.
     *
     * Reusing the browser is what keeps queue navigation reliable; a fresh
     * LoadSensor is attached each time so a previous object's callback can never
     * settle the current one.
     */
    showObject(url: string) {
      const own = internalsFor(this);
      if (!own.browser || !own.objectInline) {
        return; // still starting up; the initial load will use the new url
      }

      const generation = (own.generation += 1);
      this.state = "loading";
      this.failureReason = "";
      this.armBackstop(generation);

      try {
        own.objectInline.url = new X3D.MFString(url);
        this.watchObject(generation, own.browser.currentScene, own.objectInline);
      } catch (error) {
        this.fail(generation, String((error as Error).message || error));
      }
    },

    watchObject(generation: number, scene: any, object: any) {
      // The generation check below suppresses a stale callback's *effects*; it
      // does not release the node. Both have to happen or the scene grows for
      // the length of the review session.
      this.releaseSensor(scene);

      const own = internalsFor(this);
      const key = `${this.callbackKey}-${generation}`;
      const sensor = scene.createNode("LoadSensor");
      sensor.timeOut = LOAD_TIMEOUT_SECONDS;
      sensor.watchList = new X3D.MFNode(object);
      sensor.addFieldCallback("isLoaded", key, (loaded: any) => {
        if (!this.isCurrent(generation)) {
          return; // belongs to an object the checker has already moved past
        }
        if (loaded && loaded.valueOf()) {
          this.succeed(generation);
        } else {
          this.fail(generation, "The object file could not be loaded into the viewer.");
        }
      });
      scene.addRootNode(sensor);
      own.objectSensor = sensor;
      own.objectSensorKey = key;
    },

    /**
     * Detaches and disposes the sensor installed by the previous load.
     *
     * Wrapped because this runs during teardown as well, when the browser may
     * already be tearing its own scene down; a throw here would abandon the rest
     * of the cleanup, which is worse than the leak it is trying to prevent.
     */
    releaseSensor(scene: any) {
      const own = internalsFor(this);
      const sensor = own.objectSensor;
      if (!sensor) {
        return;
      }
      own.objectSensor = null;
      const key = own.objectSensorKey;
      own.objectSensorKey = null;

      try {
        if (key) {
          sensor.removeFieldCallback("isLoaded", key);
        }
        if (scene) {
          scene.removeRootNode(sensor);
        }
        if (typeof sensor.dispose === "function") {
          sensor.dispose();
        }
      } catch (error) {
        // Already gone, which is the state we wanted.
      }
    },

    succeed(generation: number) {
      if (!this.isCurrent(generation)) {
        return;
      }
      this.clearBackstop();
      this.state = "ready";
      this.$emit("loaded");
    },

    fail(generation: number, reason: string) {
      if (!this.isCurrent(generation)) {
        return;
      }
      this.clearBackstop();
      this.state = "failed";
      this.failureReason = reason;
      this.$emit("failed", reason);
    },

    clearBackstop() {
      const own = internalsFor(this);
      if (own.backstop !== null) {
        window.clearTimeout(own.backstop);
        own.backstop = null;
      }
    },

    /**
     * Drops the canvas when the checker itself goes away.
     *
     * Removing the element alone leaves X_ITE's browser, its scene graph and its
     * render loop alive with nothing pointing at them. The checker is a
     * long-lived page that mounts this component per object, so that is a real
     * accumulation rather than a theoretical one.
     */
    teardown() {
      this.clearBackstop();
      const own = internalsFor(this);
      own.generation += 1;

      const browser = own.browser;
      try {
        this.releaseSensor(browser && browser.currentScene);
      } catch (error) {
        // Nothing left to release.
      }

      own.objectInline = null;
      own.browser = null;

      if (browser && typeof browser.dispose === "function") {
        try {
          browser.dispose();
        } catch (error) {
          // The browser never finished starting up; there is nothing to dispose.
        }
      }

      if (own.element && own.element.parentNode) {
        own.element.parentNode.removeChild(own.element);
      }
      own.element = null;
    },
  },
});
</script>
