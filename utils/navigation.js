

export const navigateToDrawerScreen = (navigation,screenName,params={}) => {
    navigation.navigate('MainDrawer', {
      screen: screenName,
      params: params
    });
  };