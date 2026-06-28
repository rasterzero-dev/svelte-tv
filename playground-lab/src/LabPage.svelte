<script lang="ts">
  import {
    Button,
    Column,
    Icon,
    Row,
    Text,
    View,
    navigate,
    type RouteComponentProps,
  } from '../../src/index.js';

  let props: RouteComponentProps = $props();
  let count = $state(0);

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
        <Icon icon="material-symbols:flashlight-on" color="red" h={24} w={24} />
        <Text text={`Count ${count}`} fontSize={26} color="#ffffffff" />
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
  </Column>
</View>
