import { ComponentType, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageURISource, StyleSheet, View } from 'react-native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Images,
  RasterLayer,
  RasterSource,
  UserLocation,
} from '@rnmapbox/maps';

import { IS_IOS } from '../../../core/constants';
import { notNullish } from '../../../core/utils/predicates';
import { Divider, TranslucentView } from '../../../ui/components';
import { createHeaderCloseButton } from '../../../ui/components/HeaderCloseButton';
import { HeaderLogoNoProps } from '../../../ui/components/HeaderLogo';
import { useTheme } from '../../../ui/hooks/useTheme';
import { useTitlesStyles } from '../../../ui/hooks/useTitlesStyles';
import { INTERIORS_MIN_ZOOM, MAX_ZOOM, RASTER_TILE_SIZE } from '../constants';
import { PlacesContext } from '../contexts/PlacesContext';
import { useLocationGranted } from '../hooks/useLocationGranted';
import { usePlaceCategoriesMap } from '../hooks/usePlaceCategoriesMap';
import { BuildingScreen } from '../screens/BuildingScreen';
import { EventPlacesScreen } from '../screens/EventPlacesScreen';
import { FreeRoomsScreen } from '../screens/FreeRoomsScreen';
import { PlaceScreen } from '../screens/PlaceScreen';
import { PlacesScreen } from '../screens/PlacesScreen';
import { MapNavigationOptions, createMapNavigator } from './MapNavigator';

export type PlacesStackParamList = {
  Places: {
    categoryId?: string;
    subCategoryId?: string;
    pitch?: number;
  };
  Place: {
    placeId: string;
    isCrossNavigation?: boolean;
    long?: string | null;
    lat?: string | null;
    name?: string;
  };
  EventPlaces: {
    placeIds: string[];
    eventName?: string;
    isCrossNavigation?: boolean;
  };
  Building: {
    siteId: string;
    buildingId: string;
  };
  PlaceCategories: undefined;
  MessagesModal: undefined;
  FreeRooms: undefined;
};

const Map = createMapNavigator();

const MapDefaultContent = () => {
  const theme = useTheme();
  const colorScheme = useMemo(() => (theme.dark ? 'dark' : 'light'), [theme]);
  const { floorId } = useContext(PlacesContext);
  const categories = usePlaceCategoriesMap();
  const locationGranted = useLocationGranted();
  const images = useMemo<Record<string, ImageURISource>>(
    () =>
      categories
        ? Object.fromEntries(
            [
              ...new Set(
                Object.values(categories)
                  .map(c => c.markerUrl)
                  .filter(notNullish),
              ),
            ].map(uri => [uri, { uri }]),
          )
        : {},
    [categories],
  );

  return (
    <>
      {/* On iOS the location puck asks for the permission as soon as the
          map opens: it waits until "Go to my position" has asked for it */}
      {(!IS_IOS || locationGranted) && <UserLocation />}

      {/* Marker images */}
      <Images images={images} />

      {/* Outdoor map */}
      <RasterSource
        key={`outdoorSource:${colorScheme}`}
        id="outdoorSource"
        tileUrlTemplates={[
          `https://app.didattica.polito.it/tiles/${colorScheme}/{z}/{x}/{y}.png`,
        ]}
        tileSize={RASTER_TILE_SIZE}
        maxZoomLevel={MAX_ZOOM}
      >
        <RasterLayer
          id="outdoor"
          aboveLayerID="background"
          style={{ rasterOpacity: 1 }}
        />
      </RasterSource>

      {/* Indoor map */}
      <RasterSource
        key={`indoorSource:${colorScheme}:${floorId}`}
        id="indoorSource"
        tileUrlTemplates={[
          `https://app.didattica.polito.it/tiles/int-${colorScheme}-${floorId?.toLowerCase()}/{z}/{x}/{y}.png`,
        ]}
        tileSize={RASTER_TILE_SIZE}
        minZoomLevel={INTERIORS_MIN_ZOOM}
        maxZoomLevel={MAX_ZOOM}
      >
        <RasterLayer
          id="indoor"
          aboveLayerID="outdoor"
          style={{ rasterOpacity: 1 }}
        />
      </RasterSource>
    </>
  );
};

type UnreadMessageModalProps = NativeStackNavigationProp<
  PlacesStackParamList,
  'MessagesModal',
  undefined
>;
interface PlacesNavigatorProps {
  unreadMessagesModal: ComponentType<any>;
  /**
   * Header options from the app: `root` for the map without a category
   * filter when it is the first screen of a tab, `inner` for every screen.
   * Without them the headers stay as they were.
   */
  headerOptions?: {
    root?: MapNavigationOptions;
    inner?: MapNavigationOptions;
  };
}

export const PlacesNavigator = ({
  unreadMessagesModal,
  headerOptions,
}: PlacesNavigatorProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [floorId, setFloorId] = useState<string>();

  const checkAndSetFloorId = (id?: string) => {
    if (id) {
      setFloorId(id);
    }
  };
  // Location is asked for when the student taps "Go to my position", not
  // when the map opens: see PlacesScreen

  return (
    <PlacesContext.Provider
      value={{
        floorId,
        setFloorId: checkAndSetFloorId,
        showLogo: !headerOptions?.root,
      }}
    >
      <Map.Navigator
        id="PlacesTabNavigator"
        screenOptions={{
          orientation: 'portrait',
          headerBackButtonDisplayMode: 'default',
          headerTransparent: true,
          headerBackground: () => (
            <View style={StyleSheet.absoluteFill}>
              <TranslucentView fallbackOpacity={1} />
              <Divider
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
              />
            </View>
          ),
          mapDefaultOptions: {
            camera: {
              animationDuration: 2000,
              animationMode: 'flyTo',
              maxZoomLevel: MAX_ZOOM,
            },
            attributionEnabled: false,
            compassEnabled: false,
            styleJSON: JSON.stringify({
              version: 8,
              glyphs:
                'https://app.didattica.polito.it/maps_fonts/{fontstack}/{range}.pbf',
              sources: {},
              layers: [],
            }),
          },
          mapDefaultContent: MapDefaultContent,
          ...useTitlesStyles(theme),
          ...headerOptions?.inner,
        }}
      >
        <Map.Screen
          name="Places"
          component={PlacesScreen}
          options={({
            route,
          }: {
            route: { params?: { categoryId?: string; subCategoryId?: string } };
          }) => ({
            title: t('placesScreen.title'),
            ...(!route.params?.categoryId &&
              !route.params?.subCategoryId &&
              headerOptions?.root),
          })}
          getId={({ params }: { params: any }) =>
            [params?.categoryId, params?.subCategoryId].join()
          }
        />
        <Map.Screen
          name="Place"
          component={PlaceScreen}
          options={{
            title: t('placeScreen.title'),
          }}
        />
        <Map.Screen
          name="EventPlaces"
          component={EventPlacesScreen}
          options={{
            title: t('eventPlacesScreen.title'),
          }}
        />
        <Map.Screen
          name="Building"
          component={BuildingScreen}
          options={{
            title: t('common.building'),
          }}
        />
        <Map.Screen
          name="MessagesModal"
          component={unreadMessagesModal}
          options={({
            navigation,
          }: {
            navigation: UnreadMessageModalProps;
          }) => ({
            headerTitle: t('messagesScreen.title'),
            headerLargeTitle: false,
            presentation: 'modal',
            headerLeft: HeaderLogoNoProps,
            headerRight: createHeaderCloseButton(navigation),
          })}
        />
        <Map.Screen
          name="FreeRooms"
          component={FreeRoomsScreen}
          options={{
            title: t('freeRoomsScreen.title'),
          }}
        />
      </Map.Navigator>
    </PlacesContext.Provider>
  );
};
