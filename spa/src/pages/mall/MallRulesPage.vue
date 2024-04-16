<template>
  <div class="flex-1 flex justify-center">
    <div class="py-5" style="max-width:600px;">
      <router-link to="/mall/upload"><button class="btn">Back</button></router-link>
      <h1 class="font-bold text-center">Mall Rules</h1>
      <br />
      <h2 class="underline font-bold">Files</h2>
      <b class="text-green">Object File</b>
      <br />
      <ul class="list-disc ml-5">
        <li>All object files must be a WRL VRML97 file. Objects saved as an avatar will not be accepted.</li>
        <li>WRL files must be under 80kb.</li>
      </ul>
      <br />
      <b class="text-green">Texture File</b>
      <br />
      <ul class="list-disc ml-5">
        <li>Texture files must be in .JPEG format.</li>
        <li>Texture files must be under 80kb.</li>
      </ul>
      <br />
      <b class="text-green">Thumbnail File</b>
      <br />
      <ul class="list-disc ml-5">
        <li>Thumbnail image must be in .JPEG format.</li>
        <li>Maximum thumbnail dimensions is 450 x 450 pixels.</li>
        <li>Thumbnail file size must be under 80kb.</li>
      </ul>
      <br />
      <h2 class="underline font-bold">Thumbnail</h2>
      <b class="text-green">Details</b>
      <br />
      <ul class="list-disc ml-5">
        <li>Must have the object name.</li>
        <li>Must have teh creators name(s).</li>
        <li>Must have the mall price.</li>
        <li>Must have the limit of the object, or say unlimited if there is no limit.</li>
        <li>Must show the date uploaded.</li>
        <li>Must show the exact object in the WRL file and not misrepresent the object in any way.</li>
      </ul>
      <br />
      <h2 class="underline font-bold">Object</h2>
      <b class="text-green">Size</b>
      <br />
      <ul class="list-disc ml-5">
        <li>The maximum size of an object is 10 x 10 x 10 meters.</li>
        <li>The scale of the objects should be about 25% larger than real life to appear correctly inside of Cybertown.</li>
      </ul>
      <br />
      <b class="text-green">Position</b>
      <br />
      <ul class="list-disc ml-5">
        <li>The bottom of the object must be touching the floor at -1.75 on the Y axis. This includes objects that are designed to be on the ceiling or hung on walls.</li>
        <li>Objects must be centered on the X axis. Center is 0.</li>
        <li>Objects must not extend farther than +1 meter on the Z axis.</li>
      </ul>
      <br />
      <b class="text-green">Texture</b>
      <br />
      <ul class="list-disc ml-5">
        <li>Objects can only have 1 texture file applied to it.</li>
        <li>Texture files must be in the same directory as the source file. <i>(Texture file should look like "filename.jpeg" when applied to the object and not "/directory/directory/filename.jpeg")</i></li>
        <li>Textures shall not be linked to an external source.</li>
        <li>It is best to use a base-color of white for textured objects as the colors tend to bleed through the texture and cause it to not look correct. If you intensionally want the color to bleed through, please let the mall staff know when you upload the object.</li>
        <li>Posters/art must be legibly signed by the creator.</li>
      </ul>
      <br />
      <b class="text-green">Animation</b>
      <br />
      <ul class="list-disc ml-5">
        <li>Animations shall be off by default and triggered by a touch sensor or a proximity sensor.</li>
        <li>All animations must be able to be stopped on demand.</li>
        <li>The size of the sensor must be relative to the size of the object.</li>
        <li>H-Anim containers are not allowed.</li>
      </ul>
      <br />
      <b class="text-green">Lights</b>
      <br />
      <ul class="list-disc ml-5">
        <li>Objects shall not contain any directional lights.</li>
        <li>Objects may only use pointlights and/or spotlights if it is necessary to the function of the object. <i>(Example: Light fixture, disco lights, candle, etc.)</i></li>
        <li>The light shall be off by default and use a touch sensor or proximity sensor to turn the light on and off.</li>
      </ul>
      <br />
      <b class="text-green">Viewpoints</b>
      <br />
      <ul class="list-disc ml-5">
        <li>Viewpoints may only be used when they are inherent to the object created. <i>(Example: A rollercoaster ride, an airplane with controls, an interactive object, etc.)</i></li>
        <li>Viewpoint must automatically unbind from the user when the user steps away.</li>
        <li>All viewpoitns must be named.</li>
      </ul>
      <br />
      <b class="text-green">Content</b>
      <br />
      <ul class="list-disc ml-5">
        <li>Objects shall not contain any inflammatory content. <i>(For information on what is considered inflammatory content, please see section 2 & 5 of the <a href="#/rulesandregulations">Rules & Regulations</a>.)</i></li>
        <li>Objects shall not contain any potentially offensive material.</li>
        <li>Objects that depiect or contain imagery of bodily harm are not allowed.</li>
        <li>Weapons or bombs that show gore are not allowed.</li>
        <li>If the object refers to another CT user, that user must send the mall a message giving you permission to use their name in your object.</li>
        <li>Model's clothing must meet the minimum coverage that is required in Cybertown.</li>
      </ul>
      <br />
      <b class="text-green">World Info</b>
      <br />
      <ul class="list-disc ml-5">
        <li>All objects must have world info.</li>
        <li>World info must contain the name of hte object, the creator, the price, the quantity, and the date it was uploaded.</li>
      </ul>
      <br />
      <b class="text-green">Copyrights</b>
      <br />
      <ul class="list-disc ml-5">
        <li>The 3d model uploaded must be created by you, or have permission sent to the mall from the creator for you to upload the item.</li>
        <li>The use of public-domain objects is allowed with limitations. Any object from a public-domain shall not be the primary model of the object.</li>
        <li>Objects shall not contain celebrity names or their likeness in any way.</li>
        <li>Fan-art of copyrighted/trademarked material is not allowed.</li>
        <li>Objects shall not contain any trademarked symbols or names.</li>
        <li>Be able to verify that you made an object, art, or texture if asked.</li>
      </ul>
      <br />
      <b class="text-green">Permissions</b>
      <br />
      <ul class="list-disc ml-5">
        <li>Any object that has 2 or more creators must have the creator(s) that do not upload the object inbox the malls tating their permission for the user to upload the item.</li>
        <li>The creator listed in the world info must match the user uploading the object unless permission is sent to the mall staff.</li>
      </ul>
      <br />
      <b class="text-green">Miscellaneous</b>
      <br />
      <ul class="list-disc ml-5">
        <li>Poster/Art objects shall not be billboards.</li>
        <li>Entire objects shall not be billboards.</li>
        <li>Polygonal faces on the model should not be drawn backwards. If you need to do this for a certain effect on the object, please let the mall staff know when you upload the object.</li>
        <li>Object shall not create significant lagging in the world due to poly count, shape count, particle systems, references, etc.</li>
        <li>Objects must show creativity and effort.</li>
        <li>No full-size buildings will be accepted. <i>(4 walls, roof, and floor.)</i></li>
        <li>PROTOS are allowed, but EXTERNPROTOS are not.</li>
        <li>Inlining is not allowed.</li>
        <li>Sound nodes are not allowed.</li>
        <li>Objects that are uploaded shall not be created by a user that has been banned from uploading in Cybertown.</li>
      </ul>
      <br />
      <h2 class="underline font-bold">Uploading</h2>
      <b class="text-green">Public Objects</b>
      <br />
      <ul class="list-disc ml-5">
        <li>Object name shall not contain any of these characters: [ ] { } ( ) " * < > -</li>
        <li>The price must match the thumbnail and world info.</li>
        <li>The quantity must match the thumbnail and world info.</li>
        <li>You must only uploaded up to the limit that is listed on the thumbnail and in the world info.</li>
        <li>Indentical objects can only be uploaded 3 times with different colors/textures unless specified on the thumbnail that the object is part of a series of a certain number.</li>
        <li>Limited objects may only be uploaded once.</li>
        <li>Posters, wall hangings, rugs, and tapestries are limited to 1 per user per week.</li>
        <li>A maximum of 500 instances can be uploaded at one time.</li>
      </ul>
      <br />
      <b class="text-green">Personal Holds</b>
      <br />
      <ul class="list-disc ml-5">
        <li>You are allowed 2 personal holds in a rolling 7-day period.</li>
        <li>You are only allowed 8 personal holds in a 4-week period.</li>
        <li>Objects uploaded as holds cannot be re-uploaded as a public object or as another hold.</li>
        <li>You can upload up to 10 of a personal hold at 1,000cc each.</li>
      </ul>
      <br />
      <b class="text-green">City Holds</b>
      <br />
      <ul class="list-disc ml-5">
        <li>You must have permission sent to the mall from the DCL/CL of your colony to upload a city hold.</li>
        <li>The DCL/CL must include who will be making the object and what event it is for.</li>
        <li>You can upload up to 30 of a city hold at 10cc each.</li>
        <li>Object world info must contain event information.</li>
      </ul>
      <br />
      <br />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "mall-rules",
  data: () => {
    return {};
  },
});
</script>

