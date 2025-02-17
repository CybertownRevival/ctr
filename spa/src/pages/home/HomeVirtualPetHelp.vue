<template>
  <div class="flex-1 w-full text-center text-xl">
    <div class="w-4/5 justify-self-center">
      <div class="text-3xl text-green p-3">How to program your new Pet</div>
      <ul class="text-left list-decimal">
        <li> Give your new Pet a nickname</li>
        <li> Enter the address of your Pet's avatar or choose one from the Cybertown Library</li>
        <li> Set up your Pet's responses:</li>
        <div class="pl-20">
          <ul class="list-disc">
            <li> 
              <B>Exact</B><br>
              This means the words you enter must be exactly what the visitor to your 
              house types in order for the Pet to respond. In other words, if you enter, 
              "What are you?" (without the quotes), the visitor would have to type 
              exactly "What are you?" in order to have the Pet respond.<br><br>
            </li>  
            <li> <B>And</B><br>
              This means that what the visitor types must contain all the words that you 
              entered. As an example, if you entered, "party your house" and the visitor 
              typed "Can I have a party in your house?", then the Pet would respond. The 
              order of the words you enter is not important.<br><br>
            </li>
            <li> 
              <B>Or</B><br>
              This means that what the visitor types may contain any of the words that 
              you entered. As an example, if you entered, "Where your owner" and the 
              visitor typed "Where is everybody?" or "Are you the owner?", then the Pet 
              would respond.<br><br>
            </li>
            <li> 
              <dt>
              <B>Directly</B><br>
              This means that the text is said directly to the Pet, i.e. either:<br></dt>
              - somebody typed the Pet's nickname in the text<br>
              - somebody whispered to the Pet<br>
              - somebody has a private chat with the Pet.<br>
            </li>
          </ul>
        </div>
      </ul>
      <div class="py-5 text-left">
        By inventive use of the above options you can give your Pet a completely 
        unique personality as your Pet will respond differently to anybody else's!
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "VirtualPetHelp",
  data: () => {
    return {
    }
  }
})
</script>