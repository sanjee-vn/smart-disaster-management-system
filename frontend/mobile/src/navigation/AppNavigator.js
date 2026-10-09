import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from '../components/UI';
import { colors as c } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GroundReportScreen from '../screens/GroundReportScreen';
import ReportDetailsScreen from '../screens/ReportDetailsScreen';
import { AlertsScreen, ContactsScreen, GuidelinesScreen, PreferencesScreen } from '../screens/InformationScreens';
import { useAuth } from '../context/AuthContext';
import { ReportsProvider } from '../context/ReportsContext';
import LogoScreen from '../screens/auth/LogoScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import StaffHomeScreen from '../screens/StaffHomeScreen';
import StaffMapScreen from '../screens/StaffMapScreen';
import StaffResourceReportsScreen from '../screens/StaffResourceReportsScreen';

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const ICONS = { Home: 'home', Map: 'map', Reports: 'documents', Profile: 'person' };
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: c.primary, background: c.background, card: 'white', text: c.text, border: c.border } };
function MainTabs() {
  return <Tabs.Navigator screenOptions={({ route }) => ({
    headerShown: false, tabBarActiveTintColor: c.primary, tabBarInactiveTintColor: '#738991',
    tabBarHideOnKeyboard: true, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    tabBarItemStyle: { paddingVertical: 5 }, tabBarStyle: { borderTopColor: c.border },
    tabBarIcon: ({ focused, color }) => <Icon name={`${ICONS[route.name]}${focused ? '' : '-outline'}`} size={23} color={color} />,
  })}>
    <Tabs.Screen name="Home" component={HomeScreen} />
    <Tabs.Screen name="Map" component={MapScreen} />
    <Tabs.Screen name="Reports" component={ReportsScreen} />
    <Tabs.Screen name="Profile" component={ProfileScreen} />
  </Tabs.Navigator>;
}
function StaffTabs() {
  return <Tabs.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: c.primary, tabBarInactiveTintColor: '#738991', tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }, tabBarIcon: ({ focused, color }) => <Icon name={`${({ Home: 'home', Map: 'map', Reports: 'documents', Profile: 'person' })[route.name]}${focused ? '' : '-outline'}`} size={23} color={color}/> })}>
    <Tabs.Screen name="Home" component={StaffHomeScreen}/>
    <Tabs.Screen name="Map" component={StaffMapScreen}/>
    <Tabs.Screen name="Reports" component={StaffResourceReportsScreen}/>
    <Tabs.Screen name="Profile" component={ProfileScreen}/>
  </Tabs.Navigator>;
}
export default function AppNavigator() {
  const { user, onboarded, restoring, restoreError } = useAuth();
  if (restoring || restoreError) return <LogoScreen />;
  return <ReportsProvider key={user?.id || 'signed-out'} userId={user?.id}><NavigationContainer theme={theme}><Stack.Navigator screenOptions={{ headerTintColor: c.text, headerShadowVisible: false, headerTitleStyle: { fontSize: 17 }, contentStyle: { backgroundColor: c.background } }}>
    {user ? <Stack.Group navigationKey={user.id}>
    <Stack.Screen name="MainTabs" component={user.role === 'STAFF_OFFICER' ? StaffTabs : MainTabs} options={{ headerShown: false }} />
    {user.role !== 'STAFF_OFFICER' && <>
    <Stack.Screen name="ReportIncident" component={GroundReportScreen} options={{ title: 'Report an Incident' }} />
    <Stack.Screen name="ReportDetails" component={ReportDetailsScreen} options={{ title: 'Report Details' }} />
    <Stack.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alerts & Updates' }} />
    <Stack.Screen name="Contacts" component={ContactsScreen} options={{ title: 'Emergency Contacts' }} />
    <Stack.Screen name="Guidelines" component={GuidelinesScreen} options={{ title: 'Safety Guidelines' }} />
    </>}
    <Stack.Screen name="Preferences" component={PreferencesScreen} options={({ route }) => ({ title: route.params?.title || 'Preferences' })} />
    </Stack.Group> : !onboarded ? <Stack.Group navigationKey="onboarding" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingOne" component={OnboardingScreen} />
      <Stack.Screen name="OnboardingTwo" component={OnboardingScreen} />
    </Stack.Group> : <Stack.Group navigationKey="authentication" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Group>}
  </Stack.Navigator></NavigationContainer></ReportsProvider>;
}
