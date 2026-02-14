import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { ListElement as ListElementType } from '../../types/authflow.types';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import { getStoredGoogleAccounts, GoogleAccount } from '../../handlers/oauthHandler';
import { authStyles } from '../../styles/theme';

interface Props extends ListElementType {
  params?: Record<string, any>;
}

export function ListElementComponent({ label, items, onSelect }: Props) {
  const { exitToHome } = useAuthFlow();

  // Get dynamic items (currently only supports Google accounts)
  const getItems = (): GoogleAccount[] => {
    if (items === 'dynamic') {
      return getStoredGoogleAccounts();
    }
    return [];
  };

  const accountList = getItems();

  const handleSelect = (account: GoogleAccount) => {
    if (onSelect === 'APP_HOME') {
      // Login with stored account and go to home
      exitToHome();
    }
  };

  if (accountList.length === 0) {
    return null;
  }

  return (
    <View style={authStyles.listContainer}>
      {accountList.map((account, index) => (
        <TouchableOpacity
          key={account.email}
          style={authStyles.listItem}
          onPress={() => handleSelect(account)}
          activeOpacity={0.7}
        >
          <View style={authStyles.listItemAvatar}>
            <Text style={authStyles.listItemAvatarText}>
              {account.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={authStyles.listItemText}>{account.name}</Text>
            <Text style={[authStyles.listItemText, { opacity: 0.7, fontSize: 12 }]}>
              {account.email}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
