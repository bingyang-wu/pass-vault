import { useAppState } from "./hooks/useAppState";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import { ThemeType } from "./types";
import "./styles/passvault.css";

function App() {
  const {
    isLocked,
    isFirstTime,
    theme,
    entries,
    setMasterPassword,
    authenticate,
    changeMasterPassword,
    lock,
    setTheme,
    updateEntries,
  } = useAppState();

  const handleSetPassword = (password: string) => {
    setMasterPassword(password);
  };

  const handleUnlock = (password: string): boolean => {
    return authenticate(password);
  };

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
  };

  const handleChangePassword = (oldPassword: string, newPassword: string): boolean => {
    return changeMasterPassword(oldPassword, newPassword);
  };

  const handleLock = () => {
    lock();
  };

  if (isLocked || isFirstTime) {
    return (
      <AuthScreen
        isFirstTime={isFirstTime}
        onSetPassword={handleSetPassword}
        onUnlock={handleUnlock}
      />
    );
  }

  return (
    <Dashboard
      entries={entries}
      onUpdateEntries={updateEntries}
      theme={theme}
      onThemeChange={handleThemeChange}
      onChangePassword={handleChangePassword}
      onLock={handleLock}
    />
  );
}

export default App;
