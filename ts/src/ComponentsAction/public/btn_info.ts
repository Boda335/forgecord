import type { ComponentData } from '../../Base/baseComponent';

const btnInfo: ComponentData = {
  name: 'btn_info',
  enabled: true,
  botPermissions: [],
  userPermissions: [],

  action: async (client, interaction) => {
    if (!interaction.isButton()) return;
    await interaction.deferUpdate();

    try {
      // Your button logic goes here.
    } catch (error) {
      client.errorHandler.report(`Error in button btn_info: ${(error as Error).message}`, { kind: 'component', name: 'btn_info' });
      await interaction.followUp({
        content: '😓 i am sorry, it seems like i am having some issues right now, please try again later.',
        ephemeral: true,
      });
    }
  },
};

export default btnInfo;
