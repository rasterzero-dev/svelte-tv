<script lang="ts">
  import {
    Button,
    Column,
    Icon,
    Row,
    Text,
    View,
    createFontMetrics,
    measureFontText,
    navigate,
    type RouteComponentProps,
  } from '../../src/index.js';
  import { generatedFonts } from 'virtual:svelte-tv/generated-fonts';

  let props: RouteComponentProps = $props();
  let count = $state(0);
  const measuredText = 'AVATAR WAVY TEXT';
  const measuredFontSize = 32;
  const measuredMetrics = createFontMetrics(
    generatedFonts['Roboto-Regular']!,
    measuredFontSize,
  );
  const measuredWidth = measureFontText(measuredText, measuredMetrics);
  const gifUrl =
    'https://static.klipy.com/ii/4493325008d34b7bf8cd6813cd5c1619/bb/2c/e0wqUEQSusDpGnCM3.gif';
  const secondGifUrl =
    'https://static2.klipy.com/ii/d7aec6f6f171607374b2065c836f92f4/67/0b/GEZS56Cc.gif';

  function go(path: string) {
    navigate(path);
    return true;
  }

  function increment() {
    count += 1;
    return true;
  }
</script>

<View
  w={1920}
  h={1080}
  minHeight={1080}
  color="#101828ff"
  padding={80}
  display="flex"
  flexDirection="column"
>
  <Column gap={24}>
    <Text text="Lab Playground" fontSize={64} color="#f8fafcff" />
    <Text
      text={`Route: ${props.location.path}`}
      fontSize={28}
      color="#cbd5e1ff"
    />

    <Row gap={0}>
      <Button
        autofocus
        padding={18}
        color="#1f2937ff"
        borderRadius={8}
        transition={{ color: true, scale: true }}
        style={{ $focus: { color: '#2563ebff', scale: 1.04 } }}
        onEnter={() => go('/home')}
      >
        <Text text="Home" fontSize={26} color="#ffffffff" />
      </Button>
      <Button
        padding={18}
        color="#1f2937ff"
        borderRadius={8}
        transition={{ color: true, scale: true }}
        style={{ $focus: { color: '#16a34aff', scale: 1.04 } }}
        onEnter={() => go('/about')}
      >
        <Text text="About" fontSize={26} color="#ffffffff" />
      </Button>
      <Button
        padding={18}
        color="#1f2937ff"
        borderRadius={8}
        transition={{ color: true, scale: true }}
        style={{ $focus: { color: '#f59e0bff', scale: 1.04 } }}
        onEnter={increment}
      >
        <Text text={`Count ${count}`} fontSize={26} color="#ffffffff" />

        <Icon icon="material-symbols:flashlight-on" color="red" h={24} w={24} />
      </Button>
    </Row>

    <View w={720} h={180} color="#182230ff" borderRadius={8} padding={28}>
      <Text text="Use this file as your scratch area:" fontSize={26} />
      <Text
        y={48}
        text="playground-lab/src/LabPage.svelte"
        fontSize={24}
        color="#93c5fdff"
      />
    </View>

    <View w={720} h={250} color="#182230ff" borderRadius={8} padding={28}>
      <Text text="Animated GIF" fontSize={26} color="#f8fafcff" />
      <View y={52} w={320} h={180} src={gifUrl} />
      <View x={344} y={52} w={320} h={180} src={secondGifUrl} />
    </View>

    <View w={900} h={250} color="#182230ff" borderRadius={8} padding={28}>
      <Text text="alignItems stretch" fontSize={26} color="#f8fafcff" />
      <Column y={58} gap={14} alignItems="stretch">
        <Button
          autofocus
          padding={18}
          color="#243044ff"
          borderRadius={8}
          transition={{ color: true, scale: true }}
          style={{ $focus: { color: '#2563ebff', scale: 1.03 } }}
        >
          <Text
            text="a veeeeeeeeeeeeeeeeery long text"
            fontSize={26}
            color="#ffffffff"
          />
        </Button>
        <Button
          padding={18}
          color="#243044ff"
          borderRadius={8}
          transition={{ color: true, scale: true }}
          style={{ $focus: { color: '#16a34aff', scale: 1.03 } }}
        >
          <Text text="short" fontSize={26} color="#ffffffff" />
        </Button>
      </Column>
    </View>

    <View w={720} h={140} color="#182230ff" borderRadius={8} padding={28}>
      <View w={measuredWidth} clipping>
        <Text
          text={measuredText}
          fontSize={measuredFontSize}
          color="#ffffffff"
        />
      </View>
      <Text
        y={52}
        text={measuredText}
        fontSize={measuredFontSize}
        color="#ffffffff"
      />
    </View>

    <View w={720} h={160} color="#182230ff" borderRadius={8} padding={28}>
      <Text text="Rounded clipping" fontSize={26} color="#f8fafcff" />
      <View y={54} w={420} h={80} color="#111827ff" borderRadius={16} clipping>
        <View y={75} w={420} h={5} color="#ffffffff" />
      </View>
    </View>
  </Column>
</View>
