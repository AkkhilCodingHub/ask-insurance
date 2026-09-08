import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants/theme';
import { moderateScale, fontScale, responsiveContainerStyle } from '@/utils/scaling';

export function ErrorFallbackScreen({
  error,
  resetError,
  errorInfo,
}: {
  error: Error | null;
  resetError?: () => void;
  errorInfo?: ErrorInfo | null;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const friendlyReason =
    error?.message?.includes('Network') || error?.message?.includes('fetch')
      ? 'A network communication issue occurred while reaching the server.'
      : error?.message?.includes('JSON')
      ? 'A data formatting error occurred while reading the server response.'
      : error?.message?.includes('undefined')
      ? 'A property was accessed before data became available.'
      : 'An unexpected application condition occurred during operation.';

  const handleCopyDetails = async () => {
    const diag = [
      `ASK Insurance Mobile App Diagnostic Report`,
      `Platform: ${Platform.OS} (${Platform.Version})`,
      `Timestamp: ${new Date().toISOString()}`,
      `Error: ${error?.name ?? 'Error'}: ${error?.message ?? 'Unknown error'}`,
      `Stack: ${error?.stack ?? 'No stack available'}`,
      `Component Stack: ${errorInfo?.componentStack ?? 'None'}`,
    ].join('\n\n');

    try {
      await Clipboard.setStringAsync(diag);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, responsiveContainerStyle]}
        bounces={false}
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>⚠️</Text>
          </View>

          <Text style={styles.title}>Application Notice</Text>
          <Text style={styles.subtitle}>
            The application encountered a runtime issue and prevented a crash.
          </Text>

          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>Identified Reason:</Text>
            <Text style={styles.reasonText}>{friendlyReason}</Text>
            {error?.message ? (
              <Text style={styles.errorMessageText}>"{error.message}"</Text>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            {resetError ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={resetError}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleCopyDetails}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>
                {copied ? '✓ Copied to Clipboard' : 'Copy Diagnostics'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.toggleDetails}
            onPress={() => setShowDetails(!showDetails)}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleDetailsText}>
              {showDetails ? '▼ Hide Technical Trace' : '▶ Show Technical Trace'}
            </Text>
          </TouchableOpacity>

          {showDetails && (
            <View style={styles.technicalBox}>
              <Text style={styles.technicalCode}>
                {error?.stack || error?.message || 'No stack trace provided'}
                {errorInfo?.componentStack ? `\n\nComponent Stack:${errorInfo.componentStack}` : ''}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private originalHandler: any = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidMount() {
    if (typeof (global as any).ErrorUtils !== 'undefined') {
      this.originalHandler = (global as any).ErrorUtils.getGlobalHandler();
      (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        console.error('[GlobalErrorBoundary] Caught fatal/unhandled JS error:', error);
        this.setState({
          hasError: true,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });
    }
  }

  componentWillUnmount() {
    if (this.originalHandler && typeof (global as any).ErrorUtils !== 'undefined') {
      (global as any).ErrorUtils.setGlobalHandler(this.originalHandler);
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] React Component Crash:', error, errorInfo);
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback && error) {
      return fallback(error, this.resetError);
    }

    return (
      <ErrorFallbackScreen
        error={error}
        resetError={this.resetError}
        errorInfo={errorInfo}
      />
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: moderateScale(20),
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  iconCircle: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  iconText: {
    fontSize: fontScale(30),
  },
  title: {
    fontSize: fontScale(20),
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: moderateScale(6),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontScale(13),
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: fontScale(18),
    marginBottom: moderateScale(18),
  },
  reasonBox: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: moderateScale(20),
  },
  reasonLabel: {
    fontSize: fontScale(11),
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: moderateScale(4),
  },
  reasonText: {
    fontSize: fontScale(13),
    color: '#E2E8F0',
    fontWeight: '600',
    lineHeight: fontScale(18),
  },
  errorMessageText: {
    fontSize: fontScale(12),
    color: '#F87171',
    marginTop: moderateScale(6),
    fontStyle: 'italic',
  },
  actionRow: {
    width: '100%',
    gap: moderateScale(10),
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: fontScale(15),
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#CBD5E1',
    fontSize: fontScale(13),
    fontWeight: '600',
  },
  toggleDetails: {
    marginTop: moderateScale(18),
    paddingVertical: moderateScale(6),
  },
  toggleDetailsText: {
    color: '#60A5FA',
    fontSize: fontScale(12),
    fontWeight: '600',
  },
  technicalBox: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginTop: moderateScale(10),
    maxHeight: moderateScale(160),
    borderWidth: 1,
    borderColor: '#334155',
  },
  technicalCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: fontScale(10),
    color: '#94A3B8',
    lineHeight: fontScale(14),
  },
});

