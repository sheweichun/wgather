import test from 'ava';
import Vshell from '../lib/html-vshell';

const HTML = `<div>
  	<div class="top">
		<div>
			<div vshell="text">1</div>
			<div vshell="text">2</div>
			<div vshell="text">3</div>
		</div>  
	</div>
	<div class="bottom">
		<div vshell="image">image1</div>
		<div vshell="image">image2</div>
		<div vshell="image">image3</div>
	</div>
</div>
  `;
test('html-vshell transform get six targets', (t) => {
  const vshell = new Vshell(HTML);
  t.is(vshell.getTargets().length, 6);
});

test('bar', async (t) => {
  const vshell = new Vshell(HTML);
  const result = vshell.transform();
  console.log('result :', result);
  t.pass();
});
