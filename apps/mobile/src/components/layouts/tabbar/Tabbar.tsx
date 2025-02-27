import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import { getLabel } from "@react-navigation/elements"
import { CommonActions, NavigationContext, NavigationRouteContext } from "@react-navigation/native"
import type { FC } from "react"
import { memo, useContext, useEffect } from "react"
import type { StyleProp, TextStyle } from "react-native"
import { Platform, Pressable, StyleSheet, View } from "react-native"
import Animated, {
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { SetBottomTabBarHeightContext } from "@/src/components/layouts/tabbar/contexts/BottomTabBarHeightContext"
import { quickSpringPreset, softSpringPreset } from "@/src/constants/spring"
import { PlayerTabBar } from "@/src/modules/player/PlayerTabBar"
import { accentColor, useColor } from "@/src/theme/colors"

import { ThemedBlurView } from "../../common/ThemedBlurView"
import { Grid } from "../../ui/grid"
import { ScaleFadeRotateIn } from "../../ux/animations/ScaleFadeRotate"
import { BottomTabBarBackgroundContext } from "./contexts/BottomTabBarBackgroundContext"
import { BottomTabBarVisibleContext } from "./contexts/BottomTabBarVisibleContext"

export const Tabbar: FC<BottomTabBarProps> = (props) => {
  const { state, navigation, descriptors } = props
  const { routes } = state
  const setTabBarHeight = useContext(SetBottomTabBarHeightContext)

  const insets = useSafeAreaInsets()
  const tabBarVisible = useContext(BottomTabBarVisibleContext)

  const translateY = useSharedValue(0)
  useEffect(() => {
    cancelAnimation(translateY)
    translateY.value = withSpring(
      tabBarVisible ? 0 : 100,
      !tabBarVisible ? quickSpringPreset : softSpringPreset,
    )
  }, [tabBarVisible, translateY])
  return (
    <Animated.View
      accessibilityRole="tablist"
      className="absolute inset-x-0 bottom-0 z-10 py-[7]"
      style={{
        paddingBottom: insets.bottom,
        transform: [{ translateY }],
      }}
      onLayout={(e) => {
        setTabBarHeight(e.nativeEvent.layout.height)
      }}
    >
      <TabBarBackground />
      <PlayerTabBar />
      <Grid columns={routes.length} gap={10}>
        {routes.map((route, index) => {
          const focused = index === state.index
          const { options } = descriptors[route.key]!

          const inactiveTintColor = "#999"
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            })

            if (!focused && !event.defaultPrevented) {
              navigation.dispatch({
                ...CommonActions.navigate(route),
                target: state.key,
              })
            }
          }
          const label =
            typeof options?.tabBarLabel === "function"
              ? options?.tabBarLabel
              : getLabel({ label: options?.tabBarLabel, title: options?.title }, route.name)

          const accessibilityLabel =
            options?.tabBarAccessibilityLabel !== undefined
              ? options?.tabBarAccessibilityLabel
              : typeof label === "string" && Platform.OS === "ios"
                ? `${label}, tab, ${index + 1} of ${routes.length}`
                : undefined

          const renderIcon = ({ focused }: { focused: boolean }) => {
            const iconSize = ICON_SIZE_ROUND
            return (
              <TabIcon
                focused={focused}
                iconSize={iconSize}
                inactiveTintColor={inactiveTintColor}
                renderIcon={options.tabBarIcon!}
              />
            )
          }

          const renderLabel = ({ focused }: { focused: boolean }) => {
            const color = focused ? accentColor : accentColor

            if (typeof label !== "string") {
              const labelString = getLabel(
                {
                  label: typeof options?.tabBarLabel === "string" ? options.tabBarLabel : undefined,
                  title: options?.title,
                },
                route.name,
              )

              return label({
                focused,
                color,
                position: "beside-icon",
                children: labelString,
              })
            }

            return (
              <TextLabel
                focused={focused}
                accessibilityLabel={accessibilityLabel}
                label={label}
                inactiveTintColor={inactiveTintColor}
                style={styles.labelBeneath}
              />
            )
          }

          return (
            <TabItem
              key={route.key}
              route={route}
              focused={focused}
              descriptors={descriptors}
              onPress={onPress}
              originalRenderIcon={renderIcon}
              originalRenderLabel={renderLabel}
              accessibilityLabel={accessibilityLabel}
            />
          )
        })}
      </Grid>
    </Animated.View>
  )
}

const TextLabel = (props: {
  focused: boolean
  accessibilityLabel: string | undefined
  label: string
  inactiveTintColor: string
  style: StyleProp<TextStyle>
}) => {
  const { focused, accessibilityLabel, label, inactiveTintColor, style } = props

  const focusedValue = useSharedValue(focused ? 1 : 0)
  const animatedStyle = useAnimatedStyle(() => ({
    ...styles.labelBeneath,
    color: interpolateColor(focusedValue.value, [0, 1], [inactiveTintColor, accentColor]),
  }))
  useEffect(() => {
    cancelAnimation(focusedValue)
    focusedValue.value = withSpring(focused ? 1 : 0, { duration: 100 })
  }, [focused, focusedValue])
  return (
    <Animated.Text
      numberOfLines={1}
      accessibilityLabel={accessibilityLabel}
      style={StyleSheet.flatten([style, animatedStyle])}
      allowFontScaling
    >
      {label}
    </Animated.Text>
  )
}
const TabIcon = ({
  focused,
  iconSize,
  inactiveTintColor,
  renderIcon,
}: {
  focused: boolean
  iconSize: number
  inactiveTintColor: string
  renderIcon: (options: { focused: boolean; size: number; color: string }) => React.ReactNode
}) => {
  const activeOpacity = focused ? 1 : 0
  const inactiveOpacity = focused ? 0 : 1
  return (
    <View style={styles.wrapperUikit}>
      {focused && (
        <Animated.View
          entering={ScaleFadeRotateIn}
          style={[styles.icon, { opacity: activeOpacity }]}
        >
          {renderIcon({
            focused: true,
            size: iconSize,
            color: accentColor,
          })}
        </Animated.View>
      )}
      {!focused && (
        <Animated.View
          entering={ScaleFadeRotateIn}
          style={[styles.icon, { opacity: inactiveOpacity }]}
        >
          {renderIcon({
            focused: false,
            size: iconSize,
            color: inactiveTintColor,
          })}
        </Animated.View>
      )}
    </View>
  )
}

// @copy node_modules/@react-navigation/bottom-tabs/src/views/TabBarIcon.tsx
const ICON_SIZE_WIDE = 31
const ICON_SIZE_TALL = 28
const ICON_SIZE_ROUND = 25
const styles = StyleSheet.create({
  labelBeneath: {
    fontSize: 10,
  },
  blurEffect: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "transparent",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    // We render the icon twice at the same position on top of each other:
    // active and inactive one, so we can fade between them:
    // Cover the whole iconContainer:
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
  },
  wrapperUikit: {
    width: ICON_SIZE_WIDE,
    height: ICON_SIZE_TALL,
  },
})

const AnimatedThemedBlurView = Animated.createAnimatedComponent(ThemedBlurView)
const TabBarBackground = () => {
  const { opacity } = useContext(BottomTabBarBackgroundContext)

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    ...styles.blurEffect,
  }))
  const borderColor = useColor("opaqueSeparator")
  return <AnimatedThemedBlurView style={[styles.blurEffect, animatedStyle, { borderColor }]} />
}

const TabItem = memo(
  // eslint-disable-next-line @eslint-react/no-unstable-context-value
  ({
    route,
    focused,
    descriptors,
    onPress,
    originalRenderIcon,
    originalRenderLabel,
    accessibilityLabel,
  }: {
    route: any
    focused: boolean
    descriptors: any
    onPress: () => void
    originalRenderIcon: (scene: { route: any; focused: boolean }) => React.ReactNode
    originalRenderLabel: (scene: { route: any; focused: boolean }) => React.ReactNode
    accessibilityLabel?: string
  }) => {
    const pressed = useSharedValue(0)

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: 1 - 0.15 * pressed.value }],
      }
    })

    const scene = { route, focused }

    return (
      <NavigationContext.Provider value={descriptors[route.key]?.navigation}>
        <NavigationRouteContext.Provider value={route}>
          <Pressable
            onPress={onPress}
            onPressIn={() => {
              pressed.value = withSpring(1, { damping: 15, stiffness: 150 })
            }}
            onPressOut={() => {
              pressed.value = withSpring(0, { damping: 15, stiffness: 150 })
            }}
            className="flex-1 flex-col items-center justify-center"
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
          >
            <Animated.View style={animatedStyle}>{originalRenderIcon(scene)}</Animated.View>
            {originalRenderLabel(scene)}
          </Pressable>
        </NavigationRouteContext.Provider>
      </NavigationContext.Provider>
    )
  },
)
